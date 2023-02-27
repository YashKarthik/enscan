import { extractDataFromEvent, getNameRegisteredEvent } from "../../../utils/update-ens";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { AlchemyProvider } from "ethers";
import { env } from "~/env.mjs";
import { z } from "zod";

const provider = new AlchemyProvider("mainnet", env.ALCHEMY_API_KEY);

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.string().url())
    .query(async () => {

      const events = await getNameRegisteredEvent(provider, 16717729);
      const t = await extractDataFromEvent(provider, events[0]!);
      console.log(t);

      return {
        data: "yes"
      };
    }),
});
