import { RedisClient } from "../redis";
import {
  createUserGameRoomCodeEntry,
  deleteUserGameRoomCodeEntry,
  getUserGameRoomCode,
} from "../user";
import {
  GAME_ROOM_CODE_LEN,
  GAME_ROOM_MAX_PLAYER_COUNT,
  GAME_ROOM_TTL,
} from "./constant";
import { GameRoom, GameRoomStatus } from "./type";
import { generateUniqueGameCode, makeGameRoomKey } from "./util";

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
    input: {
      gameRoomCode,
      userId,
    },
  });

  try {
    await redisClient.hset(gameRoomKey, gameRoom);
    await redisClient.expire(gameRoomKey, GAME_ROOM_TTL);
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
  updateInput,
}: {
  redisClient: RedisClient;
  gameRoomCode: string;
  updateInput: Partial<
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

  await redisClient.hset(gameRoomKey, updateInput);

  return updateInput;
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

  const value = await redisClient.hgetall(gameRoomKey);

  return GameRoom.nullable().parse(value);
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

  const value = await redisClient.hgetall(gameRoomKey);

  if (!value) {
    return null;
  }

  return GameRoom.parse(value);
}

export async function addNewPlayerToGameRoom({
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

  const tokenAlreadyPresent = gameRoom.players.some(
    (player) => player.token === input.playerToken
  );

  if (tokenAlreadyPresent) {
    throw new Error("Player token already exists");
  }

  const nameAlreadyPresent = gameRoom.players.some(
    (player) => player.name === input.playerName
  );

  if (nameAlreadyPresent) {
    throw new Error("Player name already exists");
  }

  const updatedPlayers: GameRoom["players"] = [
    ...gameRoom.players,
    {
      name: input.playerName,
      token: input.playerToken,
      score: 0,
      answers: {},
    },
  ];

  await updateGameRoom({
    redisClient,
    gameRoomCode: input.gameRoomCode,
    updateInput: {
      players: updatedPlayers,
    },
  });
}

export async function validatePlayerToken({
  redisClient,
  input,
}: {
  redisClient: RedisClient;
  input: {
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

  const tokenIsPresent = gameRoom.players.some(
    (player) => player.token === input.playerToken
  );

  if (!tokenIsPresent) {
    throw new Error("Could not find player token");
  }
}

export async function recordPlayerAnswer({
  redisClient,
  input,
}: {
  redisClient: RedisClient;
  input: {
    playerToken: string;
    questionIndex: number;
    answer: string;
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

  const tokenIsPresent = gameRoom.players.some(
    (player) => player.token === input.playerToken
  );

  if (!tokenIsPresent) {
    throw new Error("Could not find player token");
  }

  if (gameRoom.currentQuestionIndex !== input.questionIndex) {
    throw new Error("Invalid question index");
  }

  const updatedPlayers = gameRoom.players.map((player) => {
    if (player.token === input.playerToken) {
      return {
        ...player,
        answers: {
          ...player.answers,
          [input.questionIndex]: input.answer,
        },
      };
    }

    return player;
  });

  await updateGameRoom({
    redisClient,
    gameRoomCode: input.gameRoomCode,
    updateInput: {
      players: updatedPlayers,
    },
  });

  return updatedPlayers;
}
