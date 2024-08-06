import { RedisClient } from "../redis";
import {
  createUserGameRoomCodeEntry,
  deleteUserGameRoomCodeEntry,
  getUserGameRoomCode,
} from "../user";
import { GameRoom, GameRoomStatus } from "./type";
import { generateUniqueGameCode, makeGameRoomKey } from "./util";

const GAME_ROOM_CODE_LEN = 6;
const GAME_ROOM_TTL = 60 * 60 * 24; // 24 hours

export async function createGameRoom({
  redisClient,
  userId,
  input,
}: {
  redisClient: RedisClient;
  userId: string;
  input: Omit<
    GameRoom,
    "code" | "players" | "questions" | "currentQuestionIndex"
  >;
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
    status: GameRoomStatus.IDLE,
    topic: input.topic,
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

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const value = await redisClient.get(gameRoomKey);

  return GameRoom.parse(value);
}
