import { z } from "zod";

export const PlayerToken = z.object({
  token: z.string(),
});

export type PlayerToken = z.infer<typeof PlayerToken>;
