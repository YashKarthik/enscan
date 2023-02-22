import { Provider, Contract, ethers, EnsResolver } from 'ethers'

export async function getENSRegistryEvents(provider: Provider, startBlock: number) {
  console.log("----------------Starting to index blocks----------------");

  const currentBlock = await provider.getBlockNumber();
  let logs: ethers.Log[] = [];

  const batchSize = 2000; // batch size for each parallel query
  const batchCount = Math.ceil((currentBlock - startBlock + 1) / batchSize);

  const batchRequests = Array.from({ length: batchCount }, (_, i) => {
    const fromBlock = startBlock + i * batchSize;
    const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);
    return provider.getLogs({
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // the ENSRegistry contract
      fromBlock,
      toBlock,
      topics: [ethers.id("NewResolver(bytes32,address)")] // `ethers.id` computes the keccak256 hash for UTF-8 strings
    });
  });

  const batchResponses = await Promise.all(batchRequests);
  logs = batchResponses.flatMap(logsInBlockRange => logsInBlockRange);

  logs.sort((a, b) => (
    a.blockNumber > b.blockNumber ? 1 : -1
  ));

  console.log("----------------Indexed upto current block----------------");
  console.log(logs);
}

