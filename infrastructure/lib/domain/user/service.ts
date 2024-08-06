import { RedisClient } from "../redis";
import { UserGameRoomCodeEntry } from "./type";
import { makeUserKey } from "./util";

export async function createUserGameRoomCodeEntry({
  redisClient,
  ttlInSeconds,
  overwriteExisting,
  input,
}: {
  redisClient: RedisClient;
  ttlInSeconds: number;
  overwriteExisting?: boolean;
  input: {
    gameRoomCode: string;
    userId: string;
  };
}) {
  const key = makeUserKey({
    userId: input.userId,
  });

  const keyExists = await redisClient.exists(key);

  if (keyExists === 1 && !overwriteExisting) {
    throw new Error(
      `User with id ${input.userId} already has a game room code`
    );
  }

  await redisClient.set(key, input.gameRoomCode, {
    ex: ttlInSeconds,
  });
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
