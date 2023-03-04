import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";
import { indexRegistrationsSinceDeployment } from "~/utils/batchedFunctions";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .query(async () => {

      indexRegistrationsSinceDeployment(provider);

      return {
        data: "yes"
      };
    }),
});
