import { z } from "zod"

/** 
  * Zod schema for each row in DB.
  *
  * Future improvements:
  *  - Index `ControllerAdded`, `ControllerRemoved` to get the controller's address.
  * */

export const Profile = z.object({
  ens: z.string().endsWith(".eth"),
  resolver: z.string().length(42),
  registrant: z.string().length(42),
  expiration_date: z.date(),
  token_id: z.string().length(66),

  avatar: z.string().url().nullable(),
  description: z.string().nullable(),
  notice: z.string().nullable(),
  keywords: z.string().array().nullable(),
  email: z.string().email().nullable(),
  url: z.string().url().nullable(),
  content_hash: z.string().url().nullable(),
  location: z.string().nullable(),

  bitcoin: z.string().min(10).max(100).nullable(),
  dogecoin: z.string().nullable(),

  discord: z.string().nullable(),
  github: z.string().nullable(),
  reddit: z.string().nullable(),
  twitter: z.string().nullable(),
  telegram: z.string().nullable(),
  linkedin: z.string().nullable(),

  ens_delegate: z.string().nullable(),

  emitted_block_number: z.number(), // block number at which this profile's event was emitted.
});

export type IProfile = z.infer<typeof Profile>;
