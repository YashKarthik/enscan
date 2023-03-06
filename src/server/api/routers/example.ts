import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";
import { getBatchedRegistrations } from "~/utils/getRegistrations";
import { parseBatchedRegistrations } from "~/utils/parseRegistrations";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .query(async () => {

      const t = await getBatchedRegistrations(provider,  16767026);
      await parseBatchedRegistrations(provider, t);

      return {
        data: "yes"
      };
    }),
});
