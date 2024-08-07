import {
  APIGatewayProxyHandler,
  APIGatewayProxyWithCognitoAuthorizerHandler,
} from "aws-lambda";
import { z } from "zod";
import { extractUserIdFromClaims } from "../../../domain/auth";
import {
  addPlayerToGameRoom,
  createGameRoom,
  deleteGameRoomByCode,
  generatePlayerToken,
  getGameRoomByCode,
  getGameRoomForUser,
} from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";
import { triggerGenerateTriviaQuestionsEvent } from "../../../domain/event";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

const redisClient = getRedisClient();

const ExpectedJsonPayload = z.object({
  name: z.string(),
  gameRoomCode: z.string(),
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

  const { name, gameRoomCode } = jsonPayloadResult.data;

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

    const playerToken = generatePlayerToken();

    await addPlayerToGameRoom({
      redisClient,
      input: {
        gameRoomCode,
        playerToken,
        playerName: name,
      },
    });

    return jsonResponse({
      statusCode: 201,
      body: {
        token: playerToken,
      },
    });
  } catch (error) {
    console.error("Unexpected error adding player", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
