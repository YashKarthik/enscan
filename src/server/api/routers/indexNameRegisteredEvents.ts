import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createClient } from '@supabase/supabase-js'
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";


import { getBatchedRegistrations } from "~/utils/getRegistrations";
import { parseBatchedRegistrations } from "~/utils/parseRegistrations";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);
const supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const supabaseAuthClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const ethRegistrarControllerRouter = createTRPCRouter({
  indexFromScratch: publicProcedure
    .query(async () => {

      const { profiles, fails } = await parseBatchedRegistrations(
        provider,
        await getBatchedRegistrations(provider,  9380471)
      );

      const { data: _, error: insertError } = await supabaseAuthClient
        .from('enscan')
        .insert(profiles)

      if (insertError) {
        console.log("\n--------------- ERROR while inserting to Supabase in procedure: indexFromScratch\n");
        console.log(insertError);
        return {
          success: false,
          error: insertError
        }
      }

      const { data: __, error: insertMetadataError } = await supabaseAuthClient
        .from('indexing_metadata')
        .insert({ last_blocknumber: profiles.at(-1)?.emitted_block_number, fails: fails});

      if (insertMetadataError) {
        console.log("\n--------------- ERROR while inserting fails to Supabase in procedure: indexFromScratch\n");
        console.log(insertMetadataError);
        return {
          success: false,
          error: insertMetadataError
        }
      }

      return {
        success: true,
        error: null
      };
    }),

  indexFromBlock: publicProcedure
    .input(z.object({
      startBlock: z.number()
    }))
    .query(async ({ input }) => {

      const { profiles, fails} = await parseBatchedRegistrations(
        provider,
        await getBatchedRegistrations(provider,  input.startBlock)
      );

      // upsert to supabase, ensName(id) as conflict param.
      
      const { data: _, error: upsertError } = await supabaseAuthClient
        .from('enscan')
        .upsert(profiles, { onConflict: "ens" });

      if (upsertError) {
        console.log("\n--------------- ERROR while upserting to Supabase in procedure: indexFromBlock \n");
        console.log(upsertError);
        return {
          success: false,
          error: upsertError
        }
      }

      const { data: __, error: insertMetadataError } = await supabaseAuthClient
        .from('indexing_metadata')
        .insert({ last_blocknumber: profiles.at(-1)?.emitted_block_number, fails: fails});

      if (insertMetadataError) {
        console.log("\n--------------- ERROR while inserting fails to Supabase in procedure: indexFromBlock\n");
        console.log(upsertError);
        return {
          success: false,
          error: upsertError
        }
      }

      return {
        success: true,
        error: null
      }
    }),

  indexFromLastSync: publicProcedure
    .query(async () => {

      const { data, error: fetchError } = await supabaseAnonClient
        .from('indexing_metadata')
        .select("last_blocknumber")
        .order("id", { ascending: false})
        .limit(1);

      if (fetchError) {
        console.log("\n--------------- ERROR while fetching lastSyncedBlockNum from Supabase in procedure: indexFromLastSync \n");
        console.log(fetchError);
        return {
          success: false,
          error: fetchError
        }
      }

      const lastSyncedBlockNum = data[0]?.last_blocknumber as number;

      const { profiles, fails} = await parseBatchedRegistrations(
        provider,
        await getBatchedRegistrations(provider,  lastSyncedBlockNum)
      );

      const { data: __, error: insertError } = await supabaseAuthClient
        .from('enscan')
        .upsert(profiles, { onConflict: "ens" });

      if (insertError) {
        console.log("\n--------------- ERROR while upserting to Supabase in procedure: indexFromLastSync \n");
        console.log(fetchError);
        return {
          success: false,
          error: insertError
        }
      }

      const { data: _, error: insertMetadataError } = await supabaseAuthClient
        .from('indexing_metadata')
        .insert({ last_blocknumber: profiles.at(-1)?.emitted_block_number, fails: fails});

      if (insertMetadataError) {
        console.log("\n--------------- ERROR while inserting fails to Supabase in procedure: indexFromLastSync\n");
        console.log(insertMetadataError);
        return {
          success: false,
          error: insertMetadataError
        }
      }

      return {
        success: true,
        error: null
      }
    }),
});
