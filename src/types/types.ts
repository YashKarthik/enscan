import { z } from "zod"

const Profile = z.object({
  ensName: z.string().endsWith(".eth"),
  registrant: z.string().length(40),
  controller: z.string().length(40),
  expirationDate: z.date(),
  tokenId: z.string().length(77),

  contentHash: z.string().url().optional(),
  bitcoin: z.string().min(10).max(100).optional(),
  dogecoin: z.string().optional(),
  litecoin: z.string().optional(),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
  avatar: z.string().url().optional(),
  description: z.string().optional(),
  notice: z.string().optional(),
  keywords: z.string().array().optional(),
  discord: z.string().optional(),
  github: z.string().optional(),
  reddit: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  linkedIn: z.string().optional(),
  ensDelegate: z.string().optional()
});

export type IProfile = z.infer<typeof Profile>;
