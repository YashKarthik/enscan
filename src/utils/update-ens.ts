import { Provider, Contract, ethers, EnsResolver } from 'ethers'


export async function getENSRegistryEvents(provider: Provider, startBlock: number) {
  console.log('Starting to index blocks.');

  let endBlock = startBlock + 2000; // 2000 blocks is AlchemyAPI request limit.
  const currentBlock = await provider.getBlockNumber();
  let logs: ethers.Log[] = [];

  while (true) {
    if (endBlock > currentBlock) {
      endBlock = currentBlock;
    }
    console.log("Now:", startBlock, endBlock)
    const logsInBlockRange = await provider.getLogs({
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // the ENSRegistry contract
      fromBlock: startBlock,
      toBlock: endBlock,
      topics: [ethers.id("NewResolver(bytes32,address)")]    // `ethers.id` computes the keccak256 hash for UTF-8 strings
    });

    logs = logs.concat(logsInBlockRange);
    if (endBlock == currentBlock) break;
    startBlock += 2000
    endBlock += 2000
    if (endBlock > currentBlock) {
      endBlock = currentBlock;
    }
  }


  logs.sort((a, b) => (
    a.blockNumber > b.blockNumber ? 1:-1
  ));

  console.log('Here', logs);
}
