import { z } from "zod"

/** 
  * Zod schema for each row in DB.
  *
  * Future improvements:
  *  - Index `ControllerAdded`, `ControllerRemoved` to get the controller's address.
  * */

const Profile = z.object({
  ensName: z.string().endsWith(".eth"),
  resolver: z.string().length(40),
  registrant: z.string().length(40),
  expirationDate: z.date(),
  tokenId: z.string().length(77),

  contentHash: z.string().url().nullable(),
  bitcoin: z.string().min(10).max(100).nullable(),
  dogecoin: z.string().nullable(),
  email: z.string().email().nullable(),
  url: z.string().url().nullable(),
  avatar: z.string().url().nullable(),
  description: z.string().nullable(),
  notice: z.string().nullable(),
  keywords: z.string().nullable(),
  discord: z.string().nullable(),
  github: z.string().nullable(),
  reddit: z.string().nullable(),
  twitter: z.string().nullable(),
  telegram: z.string().nullable(),
  linkedIn: z.string().nullable(),
  ensDelegate: z.string().nullable()
});

export type IProfile = z.infer<typeof Profile>;
