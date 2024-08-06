import { type Prisma } from "@prisma/client";
import { type DbClient } from "~/server/db";
import { generateNextTriviaQuestion } from "../question";
import { generateUniqueGameCode } from "./util";
import { TRPCError } from "@trpc/server";

async function findActiveGameRoomsForUser({
  dbClient,
  userId,
}: {
  dbClient: DbClient;
  userId: string;
}) {
  return await dbClient.gameRoom.findFirst({
    where: {
      archivedAt: null,
      createdById: userId,
      state: {
        status: {
          notIn: ["FINISHED", "FAILED"],
        },
      },
    },
  });
}

export async function createGameRoom({
  dbClient,
  userId,
  input,
}: {
  dbClient: DbClient;
  userId: string;
  input: Pick<Prisma.GameRoomCreateInput, "title" | "topic">;
}) {
  const activeGames = await findActiveGameRoomsForUser({
    dbClient,
    userId,
  });

  if (activeGames) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "You already have an active game",
    });
  }

  const code = await generateUniqueGameCode({
    dbClient,
    codeLen: 6,
  });

  return await dbClient.gameRoom.create({
    data: {
      ...input,
      code,
      createdById: userId,
      maxPlayerCount: 10, // TODO: make this configurable
      state: {
        create: {
          status: "IDLE",
        },
      },
    },
  });
}

// TODO: must have at least one player to start
export async function startGameRoom({
  dbClient,
  input,
}: {
  dbClient: DbClient;
  input: {
    gameRoomId: string;
    topic: string;
  };
}) {
  const triviaQuestion = await generateNextTriviaQuestion({
    previousQuestions: [],
    topic: input.topic,
  });

  return await dbClient.gameRoom.update({
    where: { id: input.gameRoomId },
    data: {
      questions: {
        create: {
          text: triviaQuestion.question,
          type: "MULTIPLE_CHOICE",
          multipleChoiceQuestion: {
            create: {
              options: triviaQuestion.choices,
              answer: triviaQuestion.answer,
            },
          },
        },
      },
      state: {
        update: {
          status: "IN_PROGRESS",
        },
      },
    },
  });
}

export async function getGameRoomById({
  id,
  dbClient,
}: {
  id: string;
  dbClient: DbClient;
}) {
  return await dbClient.gameRoom.findUniqueOrThrow({
    where: { id },
  });
}

export async function getIdleGameRoomByCode({
  code,
  dbClient,
}: {
  code: string;

  dbClient: DbClient;
}) {
  return await dbClient.gameRoom.findUnique({
    where: { code, state: { status: "IDLE" } },
    include: {
      players: true,
      state: true,
    },
  });
}

export async function getGameRoomState({
  gameRoomId,
  dbClient,
}: {
  gameRoomId: string;
  dbClient: DbClient;
}) {
  return await dbClient.gameRoomState.findUniqueOrThrow({
    where: {
      gameRoomId,
    },
  });
}
