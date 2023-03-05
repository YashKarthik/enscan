import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";
import { getBatchedRegistrations } from "~/utils/getRegistrations";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .query(async () => {

      getBatchedRegistrations(provider, 1000);

      return {
        data: "yes"
      };
    }),
});
