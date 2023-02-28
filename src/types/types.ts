import { z } from "zod"

/** 
  * Zod schema for each row in DB.
  *
  * Future improvements:
  *  - Index `ControllerAdded`, `ControllerRemoved` to get the controller's address.
  * */

export const Profile = z.object({
  ensName: z.string().endsWith(".eth"),
  resolver: z.string().length(42),
  registrant: z.string().length(42),
  expirationDate: z.date(),
  tokenId: z.string().length(66),

  avatar: z.string().url().nullable(),
  description: z.string().nullable(),
  notice: z.string().nullable(),
  keywords: z.string().array().nullable(),
  email: z.string().email().nullable(),
  url: z.string().url().nullable(),
  contentHash: z.string().url().nullable(),
  location: z.string().nullable(),

  bitcoin: z.string().min(10).max(100).nullable(),
  dogecoin: z.string().nullable(),

  discord: z.string().nullable(),
  github: z.string().nullable(),
  reddit: z.string().nullable(),
  twitter: z.string().nullable(),
  telegram: z.string().nullable(),
  linkedIn: z.string().nullable(),

  ensDelegate: z.string().nullable()
});

export type IProfile = z.infer<typeof Profile>;
