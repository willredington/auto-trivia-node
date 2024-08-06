import { RedisClient } from "../redis";
import {
  createUserGameRoomCodeEntry,
  deleteUserGameRoomCodeEntry,
  getUserGameRoomCode,
} from "../user";
import { GameRoom, GameRoomStatus } from "./type";
import { generateUniqueGameCode, makeGameRoomKey } from "./util";

const GAME_ROOM_CODE_LEN = 6;
const GAME_ROOM_TTL = 60 * 60 * 2; // 2 hours

export async function createGameRoom({
  redisClient,
  userId,
  input,
}: {
  redisClient: RedisClient;
  userId: string;
  input: {
    title?: string;
    topic: string;
  };
}) {
  const gameRoomCode = await generateUniqueGameCode({
    codeLen: GAME_ROOM_CODE_LEN,
    redisClient,
  });

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const gameRoom: GameRoom = {
    code: gameRoomCode,
    currentQuestionIndex: 0,
    players: [],
    questions: [],
    ownerId: userId,
    status: GameRoomStatus.IDLE,
    topic: input.topic,
    title: input.title ?? input.topic,
  };

  await createUserGameRoomCodeEntry({
    redisClient,
    ttlInSeconds: GAME_ROOM_TTL,
    input: {
      gameRoomCode,
      userId,
    },
  });

  try {
    await redisClient.set(gameRoomKey, JSON.stringify(gameRoom), {
      ex: GAME_ROOM_TTL,
    });
  } catch (err) {
    console.error(err);

    await deleteUserGameRoomCodeEntry({
      redisClient,
      userId,
    });

    throw err;
  }

  return gameRoom;
}

export async function updateGameRoomByUserId({
  redisClient,
  userId,
  input,
}: {
  redisClient: RedisClient;
  userId: string;
  input: Partial<
    Pick<
      GameRoom,
      | "currentQuestionIndex"
      | "status"
      | "failureReason"
      | "players"
      | "questions"
      | "timeUntilNextQuestion"
    >
  >;
}) {
  const gameRoomForUser = await getGameRoomForUser({
    redisClient,
    userId,
  });

  if (!gameRoomForUser) {
    throw new Error(
      `User does not have an active game room for user ID ${userId}`
    );
  }

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode: gameRoomForUser.code,
  });

  const updatedGameRoom: GameRoom = {
    ...gameRoomForUser,
    ...input,
  };

  await createUserGameRoomCodeEntry({
    redisClient,
    ttlInSeconds: GAME_ROOM_TTL,
    overwriteExisting: true,
    input: {
      gameRoomCode: gameRoomForUser.code,
      userId,
    },
  });

  await redisClient.set(gameRoomKey, JSON.stringify(updatedGameRoom), {
    ex: GAME_ROOM_TTL,
  });

  return updatedGameRoom;
}

export async function deleteGameRoomByCode({
  redisClient,
  userId,
  gameRoomCode,
}: {
  redisClient: RedisClient;
  userId: string;
  gameRoomCode: string;
}) {
  const gameRoom = await getGameRoomByCode({
    redisClient,
    gameRoomCode,
  });

  if (!gameRoom) {
    throw new Error("Game room does not exist or has already been deleted");
  }

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  await deleteUserGameRoomCodeEntry({
    redisClient,
    userId,
  });

  await redisClient.del(gameRoomKey);
}

export async function getGameRoomByCode({
  redisClient,
  gameRoomCode,
}: {
  redisClient: RedisClient;
  gameRoomCode: string;
}) {
  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const value = await redisClient.get(gameRoomKey);

  return GameRoom.parse(value);
}

export async function getGameRoomForUser({
  redisClient,
  userId,
}: {
  redisClient: RedisClient;
  userId: string;
}) {
  const gameRoomCode = await getUserGameRoomCode({
    redisClient,
    userId,
  });

  if (!gameRoomCode) {
    return null;
  }

  console.log(`user has active game room: ${gameRoomCode}`);

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const value = await redisClient.get(gameRoomKey);

  return GameRoom.parse(value);
}
