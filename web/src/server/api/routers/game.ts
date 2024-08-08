import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createGameRoom } from "~/server/service/game";

export const gameRouter = createTRPCRouter({
  createGameRoom: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        title: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await createGameRoom({
        authToken: ctx.session.idToken,
        input: {
          topic: input.topic,
          title: input.title,
        },
      });
    }),
});
