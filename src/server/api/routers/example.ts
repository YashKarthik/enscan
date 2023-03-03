import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";
import { indexRegistrationsSinceLastSync } from "~/utils/batchedFunctions";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.string().url())
    .query(async () => {

      indexRegistrationsSinceLastSync(provider, 0);

      return {
        data: "yes"
      };
    }),
});
