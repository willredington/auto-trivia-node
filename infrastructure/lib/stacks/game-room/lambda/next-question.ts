import { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";
import {
  getGameRoomByCode,
  updateGameRoom,
  validatePlayerToken,
} from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";

const redisClient = getRedisClient();

const TOKEN_HEADER = "x-player-token";

const ExpectedHeaders = z.object({
  [TOKEN_HEADER]: z.string(),
});

const ExpectedJsonPayload = z.object({
  gameRoomCode: z.string(),
  nextQuestionIndex: z.number(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", JSON.stringify(event, null, 2));

  const jsonPayloadResult = ExpectedJsonPayload.safeParse(
    JSON.parse(event.body || "{}")
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

  const { nextQuestionIndex, gameRoomCode } = jsonPayloadResult.data;

  const headersResult = ExpectedHeaders.safeParse(event.headers);

  if (!headersResult.success) {
    console.error("Player token not supplied", headersResult.error);
    return jsonResponse({
      statusCode: 401,
      body: {
        message: "Player token not supplied",
      },
    });
  }

  const playerToken = headersResult.data[TOKEN_HEADER];

  try {
    await validatePlayerToken({
      redisClient,
      input: {
        gameRoomCode,
        playerToken,
      },
    });
  } catch (error) {
    console.error("Could not validate player token", error);
    return jsonResponse({
      statusCode: 401,
      body: {
        message: "Invalid player token",
      },
    });
  }

  try {
    const gameRoom = await getGameRoomByCode({
      redisClient,
      gameRoomCode,
    });

    if (!gameRoom) {
      return jsonResponse({
        statusCode: 404,
        body: {
          message: "Game room not found",
        },
      });
    }

    // TODO: Validate that the question index is within the bounds of the questions array

    await updateGameRoom({
      gameRoomCode,
      redisClient,
      updateInput: {
        currentQuestionIndex: nextQuestionIndex,
      },
    });

    return jsonResponse({
      statusCode: 204,
      body: {
        message: "No content",
      },
    });
  } catch (error) {
    console.error("Unexpected error", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
