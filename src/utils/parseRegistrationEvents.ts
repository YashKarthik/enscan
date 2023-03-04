import { ethers, AlchemyProvider, Contract } from 'ethers'
import type { IProfile } from '../types/types';
import { Profile } from '../types/types';
import ETHRegistrarControllerAbi from "../abis/ETHRegistrarController.json";
import BaseRegistrarAbi from "../abis/BaseRegistrar.json";
import { TRPCError } from '@trpc/server';

export async function getNameRegisteredEvents(provider: AlchemyProvider, fromBlock: number) {
  console.log(`\n----------------Starting to index from block ${fromBlock}----------------\n`);

  const logs = await provider.getLogs({
    address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5", // the ETHRegistrarController contract
    fromBlock,
    toBlock: fromBlock + 2000,
    topics: [ethers.id("NameRegistered(string,bytes32,address,uint256,uint256)")] // `ethers.id` does keccak256 for UTF-8 strings;
  });

  logs.sort((a, b) => (
    a.blockNumber > b.blockNumber ? 1 : -1
  ));

  console.log(`\n----------------Indexed upto block ${fromBlock + 2000}----------------\n`);
  return logs;
}

/**
  * @param provider - a provider oboject of type ethers.AlchemyProvider
  * @param startBlock - the blocknumber from which to start the indexing event logs.
  * @param endBlock - the blocknumber till which to index events.
  * @returns Promise<ethers.Log[]> - a promise containing an array of ethers.Log objects.
  *
  * Returns a list of `event NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires);`
  * emitted by the `ETHRegistrarController` contract in the provided block range.
  */

export async function getNameRegisteredEventInBlockRange(provider: AlchemyProvider, startBlock: number, endBlock?: number) {
  console.log(`\n----------------Starting to index from block ${startBlock}----------------\n`);

  const currentBlock = await provider.getBlockNumber();
  let logs: ethers.Log[] = [];

  const batchSize = 2000; // batch size for each parallel query
  const batchCount = Math.ceil(((endBlock ?? currentBlock) - startBlock + 1) / batchSize);

  const batchRequests = Array.from({ length: batchCount }, async (_, i) => {
    const fromBlock = startBlock + i * batchSize;
    const toBlock = Math.min(fromBlock + batchSize - 1, endBlock ? endBlock:currentBlock);

    //await new Promise(() => setTimeout(() => {console.log('Sending req')}, 1000))
    console.log("Current block range:", fromBlock, "---->", toBlock);

    return provider.getLogs({
      address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5", // the ETHRegistrarController contract
      fromBlock,
      toBlock,
      topics: [ethers.id("NameRegistered(string,bytes32,address,uint256,uint256)")] // `ethers.id` does keccak256 for UTF-8 strings;
    });
  });

  const batchResponses = await Promise.all(batchRequests);
  logs = batchResponses.flatMap(logsInBlockRange => logsInBlockRange);
  logs.sort((a, b) => (
    a.blockNumber > b.blockNumber ? 1 : -1
  ));

  console.log(`\n----------------Indexed upto block ${endBlock ?? currentBlock}----------------\n`);
  return logs;
}

/**
  * @returns Promise<IProfile>
  * Returns the data about ENS record extracted from the event log.
  */
export async function extractDataFromEvent(provider: AlchemyProvider, eventLog: ethers.Log): Promise<IProfile> {
  const ETHRegistrarController = new Contract(
    "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
    ETHRegistrarControllerAbi,
    provider
  );
  const BaseRegistrar = new Contract(
    "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
    BaseRegistrarAbi,
    provider
  );

  const mutableTopics = Array.from(eventLog.topics); // parseLog needs mutable array.
  const ensName = ETHRegistrarController.interface.parseLog({topics: mutableTopics, data: eventLog.data})?.args[0] as string + ".eth";
  //const ensName = "yashkarthik.eth" // for testing
  const resolver = await provider.getResolver(ensName);

  console.log("Resolving data for: ", ensName);
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
  console.log(returnObj);
  Profile.parse(returnObj);

  return returnObj;
}
