import { Provider, Contract, ethers, EnsResolver, VoidSigner } from 'ethers'
import { EnsRegistryAbi } from '../abis/EnsRegistry';
import EnsRegistryWithFallbackAbi from "../abis/EnsRegistryWithFallback.json"

/**
  * @param provider - a provider oboject of type ethers.AlchemyProvider
  * @param startBlock - the blocknumber from which to start the indexing event logs.
  * @param endBlock - the blocknumber till which to index events.
  * @returns Promise<ethers.Log[]> - a promise containing an array of ethers.Log objects.
  *
  * Creates batches of 2000 blocks each and initiates all calls; then waits for all of them to resolve
  * using Promise.all, then returns a sorted array of logs.
  */

export async function getENSRegistryEvents(provider: Provider, startBlock: number, endBlock?: number) {
  console.log(`\n----------------Starting to index from block ${startBlock}----------------\n`);

  const currentBlock = await provider.getBlockNumber();
  let logs: ethers.Log[] = [];

  const batchSize = 2000; // batch size for each parallel query
  const batchCount = Math.ceil(((endBlock || currentBlock) - startBlock + 1) / batchSize);

  const batchRequests = Array.from({ length: batchCount }, (_, i) => {
    const fromBlock = startBlock + i * batchSize;
    const toBlock = Math.min(fromBlock + batchSize - 1, endBlock ? endBlock:currentBlock);

    console.log("Current block range:", fromBlock, "---->", toBlock);

    return provider.getLogs({
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // the ENSRegistry contract
      fromBlock,
      toBlock,
      topics: [ethers.id("NewResolver(bytes32,address)")] // keccak256 for UTF-8 strings; Actual event: event NewResolver(bytes32 indexed node, address resolver);
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
  * Returns the data about ENS record extracted from the event log.
  */
export async function extractDataFromEvent(provider: Provider, eventLog: ethers.Log) {
  const namehash = eventLog.topics[1] as string; // second topic is the bytes32 indexed node

  const contract = new Contract(
    "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    EnsRegistryWithFallbackAbi as ethers.InterfaceAbi,
    provider
  );

  // @ts-expect-error
  const resolver = new ethers.EnsResolver(await contract.resolver(namehash));
  console.log(resolver.address);
}
