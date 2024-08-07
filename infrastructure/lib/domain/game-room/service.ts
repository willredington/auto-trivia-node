import { RedisClient } from "../redis";
import {
  createUserGameRoomCodeEntry,
  deleteUserGameRoomCodeEntry,
  getUserGameRoomCode,
} from "../user";
import { GameRoom, GameRoomStatus } from "./type";
import { generateUniqueGameCode, makeGameRoomKey } from "./util";

const GAME_ROOM_MAX_PLAYER_COUNT = 10;
const GAME_ROOM_CODE_LEN = 6;
const GAME_ROOM_TTL = 60 * 60 * 4; // 4 hours

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
    players: [],
    questions: [],
    ownerId: userId,
    topic: input.topic,
    code: gameRoomCode,
    currentQuestionIndex: 0,
    status: GameRoomStatus.IDLE,
    title: input.title ?? input.topic,
    maxPlayerCount: GAME_ROOM_MAX_PLAYER_COUNT,
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

export async function updateGameRoom({
  redisClient,
  gameRoomCode,
  input,
}: {
  redisClient: RedisClient;
  gameRoomCode: string;
  input: Partial<
    Pick<
      GameRoom,
      | "currentQuestionIndex"
      | "status"
      | "failureReason"
      | "players"
      | "questions"
    >
  >;
}) {
  const gameRoom = await getGameRoomByCode({
    redisClient,
    gameRoomCode,
  });

  if (!gameRoom) {
    throw new Error("Game room does not exist");
  }

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const updatedGameRoom: GameRoom = {
    ...gameRoom,
    ...input,
  };

  await createUserGameRoomCodeEntry({
    redisClient,
    ttlInSeconds: GAME_ROOM_TTL,
    overwriteExisting: true,
    input: {
      gameRoomCode,
      userId: updatedGameRoom.ownerId,
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

  const gameRoomKey = makeGameRoomKey({
    gameRoomCode,
  });

  const value = await redisClient.get(gameRoomKey);

  return GameRoom.parse(value);
}

export async function addPlayerToGameRoom({
  redisClient,
  input,
}: {
  redisClient: RedisClient;
  input: {
    playerName: string;
    playerToken: string;
    gameRoomCode: string;
  };
}) {
  const gameRoom = await getGameRoomByCode({
    gameRoomCode: input.gameRoomCode,
    redisClient,
  });

  if (!gameRoom) {
    throw new Error("Game room does not exist");
  }

  const tokenExists = gameRoom.players.some(
    (player) => player.token === input.playerToken
  );

  if (tokenExists) {
    throw new Error("Player token already exists");
  }

  const nameExists = gameRoom.players.some(
    (player) => player.name === input.playerName
  );

  if (nameExists) {
    throw new Error("Player name already exists");
  }

  const updatedPlayers: GameRoom["players"] = [
    ...gameRoom.players,
    {
      name: input.playerName,
      token: input.playerToken,
    },
  ];

  await updateGameRoom({
    redisClient,
    gameRoomCode: input.gameRoomCode,
    input: {
      players: updatedPlayers,
    },
  });
}
