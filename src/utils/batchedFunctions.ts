import { extractDataFromEvent, getNameRegisteredEventInBlockRange, getNameRegisteredEvents} from "./parseRegistrationEvents"

import { createClient } from '@supabase/supabase-js'
import { env } from "../env.mjs";
import { AlchemyProvider, ethers } from "ethers";
import { TRPCError } from "@trpc/server";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
//const adminAuthClient = supabase.auth.admin;

export async function indexRegistrationsSinceLastSync(provider: AlchemyProvider, retryCount: number) {
  let { data: indexing_metadata, error } = await supabase
    .from('indexing_metadata')
    .select('last_blocknumber')
    .order('last_blocknumber', { ascending: false})
    .limit(1);

  if (error) {
    console.log("Try count: ", retryCount);
    if (retryCount > 3) throw new TRPCError({
      message: "Error while getting last indexed block number",
      code: "INTERNAL_SERVER_ERROR",
    });
    indexRegistrationsSinceLastSync(provider, retryCount + 1)
  }

  const lastBlockIndexedBlockNum = indexing_metadata![0]!.last_blocknumber as number;

  const events = await getNameRegisteredEventInBlockRange(provider, lastBlockIndexedBlockNum);
  let fails: string[] = [];

  const data = await Promise.all(
    events.map(async (event) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await extractDataFromEvent(provider, event);
      } catch (e) {
        if (e instanceof TRPCError) {
          fails.push(e.message);
          console.log("Indexing " + e.message + " failed.");
          return null;
        }
        console.log("Another error:\n", e);
        return null;
      }
    })
  ).then((results) => results.filter((result) => result !== null));


  console.log(data);
}

//async function indexRegistrationsSinceDeployment(provider: AlchemyProvider) {
//  const REGISTRAR_DEPLOY_BLOCK = 9380471;
//  const CURRENT_BLOCK = await provider.getBlockNumber();
//  const QUERY_BATCH_SIZE = 2000;
//  
//}

export async function indexRegistrationsSinceDeployment(provider: AlchemyProvider) {
  const BATCH_SIZE = 30;
  const logs: ethers.Log[] = [];
  let fromBlock = 9380471;
  const CURRENT_BLOCK = await provider.getBlockNumber();
  const QUERY_BATCH_SIZE = 2000;
  
  while (true) {
    const batchRequests = [];

    // Generate batchRequests
    for (let i = 0; i < BATCH_SIZE; i++) {
      batchRequests.push(getNameRegisteredEvents(provider, fromBlock));
      fromBlock += QUERY_BATCH_SIZE;
    }

    // Make batchRequests with exponential backoff
    const batchResponses = await Promise.all(batchRequests.flatMap(async (request) => {
      let delay = 1000; // Start with a 1-second delay between retries
      while (true) {
        try {
          const response = await request;
          return response;
        } catch (error) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.log("HIT limit, slowing down.")
          delay *= 2; // Double the delay time

          //if (error!.response && error!.response.status === 429) {
          //  // Rate limit hit, increase delay and retry
          //  console.log(`Rate limit hit. Retrying in ${delay}ms`);
          //  await new Promise((resolve) => setTimeout(resolve, delay));
          //  delay *= 2; // Double the delay time
          //} else {
          //  // Other error, re-throw it
          //  throw error;
          //}
        }
      }
    }));

    console.log("Batch responses: ", batchResponses);
    logs.concat(batchResponses.flat());

    if (fromBlock > CURRENT_BLOCK) break;
    // Wait before starting the next batch
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("LOGS:\n");
  console.log(logs);
}

