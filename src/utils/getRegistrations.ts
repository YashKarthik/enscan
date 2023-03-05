import { createClient } from '@supabase/supabase-js'
import { env } from "../env.mjs";
import { AlchemyProvider, ethers } from "ethers";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
//const adminAuthClient = supabase.auth.admin;

//export async function indexRegistrationsSinceLastSync(provider: AlchemyProvider, retryCount: number) {
//  let { data: indexing_metadata, error } = await supabase
//    .from('indexing_metadata')
//    .select('last_blocknumber')
//    .order('last_blocknumber', { ascending: false})
//    .limit(1);
//
//  if (error) {
//    console.log("Try count: ", retryCount);
//    if (retryCount > 3) throw new TRPCError({
//      message: "Error while getting last indexed block number",
//      code: "INTERNAL_SERVER_ERROR",
//    });
//    indexRegistrationsSinceLastSync(provider, retryCount + 1)
//  }
//
//  const lastBlockIndexedBlockNum = indexing_metadata![0]!.last_blocknumber as number;
//
//  const events = await getNameRegisteredEvents(provider, lastBlockIndexedBlockNum);
//  let fails: string[] = [];
//
//  const data = await Promise.all(
//    events.map(async (event) => {
//      try {
//        await new Promise((resolve) => setTimeout(resolve, 1000));
//        return await extractDataFromEvent(provider, event);
//      } catch (e) {
//        if (e instanceof TRPCError) {
//          fails.push(e.message);
//          console.log("Indexing " + e.message + " failed.");
//          return null;
//        }
//        console.log("Another error:\n", e);
//        return null;
//      }
//    })
//  ).then((results) => results.filter((result) => result !== null));
//
//
//  console.log(data);
//}

/**
  * Fetches all `NameRegistered` event logs since `startBlock`. Implements exponential backoff to
  * prevent rate-limiting.
  */
export async function getBatchedRegistrations(provider: AlchemyProvider, startBlock=9380471) {
  const BATCH_SIZE = 30;
  let logs: ethers.Log[] = [];
  let fromBlock = startBlock;
  const CURRENT_BLOCK = await provider.getBlockNumber();
  const QUERY_BATCH_SIZE = 2000;

  console.log(`\n--------------Start block: ${startBlock} | Current block: ${CURRENT_BLOCK}\n`);
  
  while (true) {
    const batchRequests = [];

    // Generate batchRequests
    for (let i = 0; i < BATCH_SIZE; i++) {
      batchRequests.push(getNameRegisteredEvents(provider, fromBlock));

      if (fromBlock >= CURRENT_BLOCK) break; // already reached present day;
      fromBlock += QUERY_BATCH_SIZE;
      if (fromBlock > CURRENT_BLOCK) fromBlock = CURRENT_BLOCK; // crossed present day, reset; will break in next iter.
    }

    // Make batchRequests with exponential backoff
    const batchResponses = await Promise.all(batchRequests.map(async (request) => {
      let delay = 1000; // Start with a 1-second delay between retries
      while (true) {
        try {
          return (await request);
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.log("HIT limit while fetching, slowing down.")
          delay *= 2; // Double the delay time
        }
      }
    }));

    logs = logs.concat(...batchResponses);
    if (fromBlock >= CURRENT_BLOCK) break;
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before starting next batch.
  }
  console.log("\n------------------- FINISHED FETCHING -------------------\n");
  return logs;
}

/**
  * Returns an array of `NameRegistered` events emitted by the `ETHRegistrarController` contract in blocks `fromBlock`
  * to `fromBlock + 2000`.
  */
async function getNameRegisteredEvents(provider: AlchemyProvider, fromBlock: number) {
  console.log(`\`getNameRegisteredEvents\`: ${fromBlock} ----> ${fromBlock + 2000}`);

  const logs = await provider.getLogs({
    address: "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5", // the ETHRegistrarController contract
    fromBlock,
    toBlock: fromBlock + 2000,
    topics: [ethers.id("NameRegistered(string,bytes32,address,uint256,uint256)")] // `ethers.id` does keccak256 for UTF-8 strings;
  });

  logs.sort((a, b) => (
    a.blockNumber > b.blockNumber ? 1 : -1
  ));
  return logs;
}

