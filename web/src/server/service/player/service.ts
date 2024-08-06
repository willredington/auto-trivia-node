import { TRPCError } from "@trpc/server";
import { type DbClient } from "~/server/db";
import { generateToken, getPlayerSessionStoreKey } from "./util";
import { Prisma } from "@prisma/client";

export async function createPlayer({
  dbClient,
  input,
}: {
  dbClient: DbClient;
  input: Prisma.GameRoomPlayerCreateInput
}) {
  const player = await dbClient.gameRoomPlayer.create({
    data: {
      name: input.name,
      gameRoom: {
        connect: {
          code: input.gameRoomCode,
        },
      },
    },
  });

  const token = generateToken();

  const playerSessionToken: PlayerSessionToken = {
    token,
    name: player.name,
    playerId: player.id,
    gameRoomCode: input.gameRoomCode,
  };

  try {
    await redisClient.set(
      getPlayerSessionStoreKey({ token }),
      JSON.stringify(playerSessionToken),
      {
        ex: TOKEN_EXPIRATION,
      },
    );

    console.log("set player session token in redis", playerSessionToken);

    return playerSessionToken;
  } catch (error) {
    console.error("Failed to set player session token in redis", error);

    await dbClient.gameRoomPlayer.delete({
      where: {
        id: player.id,
      },
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create player session",
    });
  }
}

