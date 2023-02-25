import { ethers, Provider, Contract, EnsResolver } from 'ethers'
import type { IProfile } from '../types/types';
import ETHRegistrarControllerAbi from "../abis/ETHRegistrarController.json";

/**
  * @param provider - a provider oboject of type ethers.AlchemyProvider
  * @param startBlock - the blocknumber from which to start the indexing event logs.
  * @param endBlock - the blocknumber till which to index events.
  * @returns Promise<ethers.Log[]> - a promise containing an array of ethers.Log objects.
  *
  * Returns a list of `event NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires);`
  * emitted by the `ETHRegistrarController` contract.
  */

export async function getNameRegisteredEvent(provider: Provider, startBlock: number, endBlock?: number) {
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
export async function extractDataFromEvent(provider: Provider, eventLog: ethers.Log) {
  const ETHRegistrarController = new Contract(
    "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5",
    ETHRegistrarControllerAbi,
    provider
  );

  const mutableTopics = Array.from(eventLog.topics); // convert topics to a mutable array
  // Eg: if alice.eth registered => `ensName` would be equal to alice.
  const ensName = ETHRegistrarController.interface.parseLog({topics: mutableTopics, data: eventLog.data})?.args[0] as string;

  return {
    ensName,
  }
}
