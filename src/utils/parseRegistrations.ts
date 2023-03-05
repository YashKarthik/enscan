import { ethers, AlchemyProvider, Contract } from 'ethers'
import type { IProfile } from '../types/types';
import { Profile } from '../types/types';
import ETHRegistrarControllerAbi from "../abis/ETHRegistrarController.json";
import BaseRegistrarAbi from "../abis/BaseRegistrar.json";
import { TRPCError } from '@trpc/server';

export async function parseBatchedRegistrations(provider: AlchemyProvider, events: ethers.Log[]) {
  const fails: string[] = [];
  const profiles: IProfile[] = [];
  console.log("length", events.length);

  for (let i=0; i < events.length; i+=3) {
    let delay = 1000; // Start with a 1-second delay between retries
    const batchedRequest = [];

    for (let k=i; k <= i+3; k++) { // for each event in current batch.
      if (!events[k]) break;
      console.log("Init req:", k);
      batchedRequest.push(parseNameRegistrationEvent(provider, events[k]!)); // already checked if event[i] exists.
    }

    const batchedResponse = (await Promise.all(batchedRequest.map(async parseReq => {
      for (let j=0; j < 3; j++) { // try thrice before giving up.
        try {
          return await parseReq;
        } catch (error) {
          if (error instanceof TRPCError) {
            console.log("Unregistered name: ", error.message);
            fails.push(error.message); // error.message contains ensName, thrown below;
            return null;
          }
          console.log("HIT limit while parsing, slowing down.");
          if (delay < 10_000) delay *= 2; // Double the delay time if delay less that 10 sec
        }
        return null;
      }
    }))).filter(r => r != null && r != undefined) as NonNullable<IProfile[]>;

    console.log(batchedResponse);
    profiles.push(...batchedResponse);
    await new Promise((resolve) => setTimeout(resolve, delay));
  };

  console.log(profiles);
  return profiles;
}

//export async function parseBatchedRegistrations(provider: AlchemyProvider, events: ethers.Log[]) {
//  const fails: string[] = [];
//  const batchResponses = await Promise.allSettled(events.map(async event => {
//    let delay = 1000; // Start with a 1-second delay between retries
//    for (let i=0; i < 3; i++) {
//      try {
//        return (await parseNameRegistrationEvent(provider, event));
//      } catch (error) {
//        if (error instanceof TRPCError) {
//          console.log("Unregistered name: ", error.message);
//          fails.push(error.message); // message contains ensName, thrown below;
//          return null;
//        }
//
//        await new Promise((resolve) => setTimeout(resolve, delay));
//        console.log("HIT limit while parsing, slowing down.");
//        if (delay < 10_000) delay *= 2; // Double the delay time if delay less that 10 sec
//      }
//      return null;
//    }
//  }));
//
//  console.log(batchResponses);
//  //const responses = batchResponses.filter(r => r.status === 'fulfilled').map(r => r.value);
//  //return responses;
//}

/**
  * Returns data about ENS record extracted from `eventLog`.
  */
async function parseNameRegistrationEvent(provider: AlchemyProvider, eventLog: ethers.Log): Promise<IProfile> {

  const ETHRegistrarController = new Contract(
    "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
    ETHRegistrarControllerAbi,
    provider
  ); // for parsing events of this interface.
  const BaseRegistrar = new Contract(
    "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
    BaseRegistrarAbi,
    provider
  ); // for getting the expiry of ENS name.

  const mutableTopics = Array.from(eventLog.topics); // parseLog needs mutable array.
  const ensName = ETHRegistrarController.interface.parseLog({topics: mutableTopics, data: eventLog.data})?.args[0] as string + ".eth";
  //const ensName = "yashkarthik.eth" // for testing
  const resolver = await provider.getResolver(ensName);

  if (!resolver || resolver.address == ethers.ZeroAddress) throw new TRPCError({
    message: ensName,
    code: "NOT_FOUND",
    cause: "ENS name may not be registered, or resolver not set or rate-limited by node provider."
  });

  const tokenId = ethers.keccak256(ethers.toUtf8Bytes(ensName))

  const expiry = new Date(
    Number(
      // @ts-expect-error
      (await BaseRegistrar.nameExpires(tokenId))
      * 1000n
    )
  );

  console.log("Resolving: ", ensName);
  // Parallel fetching
  // Potential errors must be caught by callers and ens name will be skipped.
  const [
    registrant,
    contentHash,
    bitcoin,
    dogecoin,
    email,
    url,
    avatar,
    location,
    description,
    notice,
    keywords,
    discord,
    github,
    reddit,
    twitter,
    telegram,
    linkedIn,
    ensDelegate,
  ] = await Promise.all([
    resolver.getAddress(),
    resolver.getContentHash(),
    resolver.getAddress(0),
    resolver.getAddress(3),
    resolver.getText("email"),
    resolver.getText("url"),
    resolver.getText("avatar"),
    resolver.getText("location"),
    resolver.getText("description"),
    resolver.getText("notice"),
    resolver.getText("keywords"),
    resolver.getText("com.discord"),
    resolver.getText("com.github"),
    resolver.getText("com.reddit"),
    resolver.getText("com.twitter"),
    resolver.getText("org.telegram"),
    resolver.getText("com.linkedin"),
    resolver.getText("eth.ens.delegate"),
  ]);

  let urlTextRecord;
  if (!url || url?.length == 0) {
    urlTextRecord = url;
  } else {
    if (!(url.startsWith("https://") || url.startsWith("http://"))) {
      // if it passes ^, it's a url, but without the http part.
      urlTextRecord = "http://" + url;
    }
  }
  
  const returnObj = {
    ensName: ensName,
    registrant: registrant as string,
    resolver: resolver.address,
    expirationDate: expiry,
    tokenId: tokenId,
    contentHash,
    bitcoin,
    dogecoin,
    email: email || null,
    url: urlTextRecord || null,
    avatar: avatar || null,
    location: location || null,
    description: description || null,
    notice: notice || null,
    keywords: keywords?.split(",") || null,
    discord: discord || null,
    github: github || null,
    reddit: reddit || null,
    twitter: twitter || null,
    telegram: telegram || null,
    linkedIn: linkedIn || null,
    ensDelegate: ensDelegate || null,
  };

  if (!(Profile.safeParse(returnObj).success)) throw new TRPCError({
    message: ensName,
    code: "INTERNAL_SERVER_ERROR",
    cause: "Unexpected shape of Profile object"
  }); // will throw if shape is not different; caller must catch and log.

  console.log("Resolved: ", ensName, registrant);
  return returnObj;
}
