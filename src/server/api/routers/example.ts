import { getENSRegistryEvents } from "../../../utils/update-ens";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider, JsonRpcProvider } from "ethers";
import { env } from "~/env.mjs";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .query(async () => {
      await getENSRegistryEvents(provider, 16677100);
      return {
        data: "yes"
      };
    }),
});
