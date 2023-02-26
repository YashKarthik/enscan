import { ethers, AlchemyProvider, Contract, EnsResolver } from 'ethers'
import type { IProfile } from '../types/types';
import ETHRegistrarControllerAbi from "../abis/ETHRegistrarController.json";
import { TRPCError } from '@trpc/server';

/**
  * @param provider - a provider oboject of type ethers.AlchemyProvider
  * @param startBlock - the blocknumber from which to start the indexing event logs.
  * @param endBlock - the blocknumber till which to index events.
  * @returns Promise<ethers.Log[]> - a promise containing an array of ethers.Log objects.
  *
  * Returns a list of `event NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires);`
  * emitted by the `ETHRegistrarController` contract.
  */

export async function getNameRegisteredEvent(provider: AlchemyProvider, startBlock: number, endBlock?: number) {
  console.log(`\n----------------Starting to index from block ${startBlock}----------------\n`);

  const currentBlock = await provider.getBlockNumber();
  let logs: ethers.Log[] = [];

  const batchSize = 2000; // batch size for each parallel query
  const batchCount = Math.ceil(((endBlock || currentBlock) - startBlock + 1) / batchSize);

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

  console.log(`\n----------------Indexed upto block ${endBlock || currentBlock}----------------\n`);
  return logs;
}

/**
  * @returns IProfile
  * Returns the data about ENS record extracted from the event log.
  */
export async function extractDataFromEvent(provider: AlchemyProvider, eventLog: ethers.Log) {
  const ETHRegistrarController = new Contract(
    "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
    ETHRegistrarControllerAbi,
    provider
  );
  const mutableTopics = Array.from(eventLog.topics); // parseLog needs mutable array.
  const ensName = ETHRegistrarController.interface.parseLog({topics: mutableTopics, data: eventLog.data})?.args[0] as string;
  const resolver = await provider.getResolver(ensName + ".eth");

  if (!resolver || resolver.address == ethers.ZeroAddress) throw new TRPCError({
    message: "Resolver not found",
    code: "NOT_FOUND",
    cause: "ENS name may not be registered, or resolver not set."
  });

  return {
    ensName,

    // figure these out
    resolver: resolver.address,
    registrant: "",
    controller: "",
    expirationDate: new Date(),
    tokenId: "",

    contentHash: await resolver.getContentHash(),
    bitcoin: await resolver.getAddress(0),
    dogecoin: await resolver.getAddress(3),
    email: await resolver.getText("email"),
    url: await resolver.getText("url"),
    avatar: await resolver.getText("avatar"),
    description: await resolver.getText("description"),
    notice: await resolver.getText("notice"),
    keywords: await resolver.getText("keywords"),
    discord: await resolver.getText("com.discord"),
    github: await resolver.getText("com.github"),
    reddit: await resolver.getText("com.reddit"),
    twitter: await resolver.getText("com.twitter"),
    telegram: await resolver.getText("org.telegram"),
    linkedIn: await resolver.getText("com.linkedin"),
    ensDelegate: await resolver.getText("eth.ens.delegate"),
  }
}
