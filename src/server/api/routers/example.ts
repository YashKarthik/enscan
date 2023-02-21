import { getENSRegistryEvents } from "../../../utils/update-ens";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { JsonRpcProvider } from "ethers";
import { env } from "~/env.mjs";

const provider = new JsonRpcProvider(env.MAINNET_RPC_URL);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .query(async () => {
      await getENSRegistryEvents(provider, 16677100);
      return {
        data: "yes"
      };
    }),
});
