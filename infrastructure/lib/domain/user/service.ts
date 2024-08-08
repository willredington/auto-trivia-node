import { RedisClient } from "../redis";
import { UserGameRoomCodeEntry } from "./type";
import { makeUserKey } from "./util";

export async function createUserGameRoomCodeEntry({
  redisClient,
  input,
}: {
  redisClient: RedisClient;
  input: {
    gameRoomCode: string;
    userId: string;
  };
}) {
  const key = makeUserKey({
    userId: input.userId,
  });

  const keyExists = await redisClient.exists(key);

  if (keyExists === 1) {
    console.warn(
      `User with id ${input.userId} already has a game room code entry`
    );
  }

  await redisClient.set(key, input.gameRoomCode);
}

export async function getUserGameRoomCode({
  redisClient,
  userId,
}: {
  redisClient: RedisClient;
  userId: string;
}) {
  const key = makeUserKey({
    userId,
  });

  const value = await redisClient.get(key);

  return UserGameRoomCodeEntry.parse(value);
}

export async function deleteUserGameRoomCodeEntry({
  redisClient,
  userId,
}: {
  redisClient: RedisClient;
  userId: string;
}) {
  const key = makeUserKey({
    userId,
  });

  const keyExists = await redisClient.exists(key);

  if (keyExists === 1) {
    await redisClient.del(key);
    console.log(`Deleted game room code for user with id ${userId}`);
  }
}
