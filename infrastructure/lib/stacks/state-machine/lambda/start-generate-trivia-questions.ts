import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { jsonResponse } from "../../../util/http";
import { extractUserIdFromClaims } from "../../../domain/auth";
import { getGameRoomForUser } from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import {
  findRunningMatchingGenerateTriviaExecution,
  GenerateTriviaQuestionsInput,
  mapQuestionsToTriviaQuestions,
  startGenerateTriviaQuestionsStateMachine,
} from "../../../domain/state-machine/generate-trivia-questions";
import {
  getEnvironmentVariable,
  RuntimeEnvironmentVariable,
} from "../../../util/env";

const QUESTIONS_LENGTH = 20;

const redisClient = getRedisClient();

const ExpectedJsonPayload = z.object({
  gameRoomCode: z.string(),
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  const userId = extractUserIdFromClaims(
    event.requestContext.authorizer.claims
  );

  const jsonPayloadResult = ExpectedJsonPayload.safeParse(
    JSON.stringify(event.body ?? "{}")
  );

  if (!jsonPayloadResult.success) {
    console.error("Invalid body", jsonPayloadResult.error);
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Invalid body",
      },
    });
  }

  const { gameRoomCode } = jsonPayloadResult.data;

  try {
    // todo

    const gameRoom = await getGameRoomForUser({
      redisClient,
      userId,
    });

    if (!gameRoom) {
      return jsonResponse({
        statusCode: 404,
        body: {
          message: "Game room not found",
        },
      });
    }

    const matchingExecutions = await findRunningMatchingGenerateTriviaExecution(
      {
        input: {
          userId,
          gameRoomCode,
          topic: gameRoom.topic,
          questionsLength: QUESTIONS_LENGTH,
          previousQuestions: mapQuestionsToTriviaQuestions({
            questions: gameRoom.questions,
          }),
        },
      }
    );

    if (matchingExecutions.length > 0) {
      return jsonResponse({
        statusCode: 409,
        body: {
          message: "Execution already in progress",
        },
      });
    }

    const startGenerateTriviaQuestionsInput: GenerateTriviaQuestionsInput = {
      userId,
      gameRoomCode,
      topic: gameRoom.topic,
      questionsLength: QUESTIONS_LENGTH,
      previousQuestions: mapQuestionsToTriviaQuestions({
        questions: gameRoom.questions,
      }),
    };

    const startResult = await startGenerateTriviaQuestionsStateMachine({
      input: startGenerateTriviaQuestionsInput,
      generateTriviaQuestionsStateMachineArn: getEnvironmentVariable(
        RuntimeEnvironmentVariable.GENERATE_TRIVIA_QUESTIONS_STATE_MACHINE_ARN
      ),
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        input: startGenerateTriviaQuestionsInput,
        output: startResult,
      }),
    };
  } catch (error) {
    console.error(
      "Error starting generate trivia questions state machine",
      error
    );

    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
