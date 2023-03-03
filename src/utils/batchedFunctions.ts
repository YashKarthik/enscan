import { extractDataFromEvent, getNameRegisteredEventInBlockRange} from "./parseRegistrationEvents"

import { createClient } from '@supabase/supabase-js'
import { env } from "../env.mjs";
import { AlchemyProvider } from "ethers";
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
