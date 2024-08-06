import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { extractUserIdFromClaims } from "../../../domain/auth";
import {
  createGameRoom,
  deleteGameRoomByCode,
  getGameRoomForUser,
} from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";
import { triggerGenerateTriviaQuestionsEvent } from "../../../domain/event";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

const redisClient = getRedisClient();

const eventBridgeClient = new EventBridgeClient();

const ExpectedJsonPayload = z.object({
  topic: z.string(),
  title: z.string().optional(),
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  const userId = extractUserIdFromClaims(
    event.requestContext.authorizer.claims
  );

  const jsonPayloadResult = ExpectedJsonPayload.safeParse(
    JSON.parse(event.body ?? "{}")
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

  const { title, topic } = jsonPayloadResult.data;

  try {
    const gameRoom = await getGameRoomForUser({
      redisClient,
      userId,
    });

    if (gameRoom) {
      return jsonResponse({
        statusCode: 409,
        body: {
          message: "User already has an active game room",
        },
      });
    }

    const newGameRoom = await createGameRoom({
      redisClient,
      userId,
      input: {
        title,
        topic,
      },
    });

    try {
      await triggerGenerateTriviaQuestionsEvent({
        client: eventBridgeClient,
        input: {
          gameRoomCode: newGameRoom.code,
          userId,
        },
      });
    } catch (err) {
      console.error(
        "Something went wrong trigger the generate trivia questions event, deleting game room",
        newGameRoom
      );

      await deleteGameRoomByCode({
        redisClient,
        userId,
        gameRoomCode: newGameRoom.code,
      });

      throw err;
    }

    return {
      statusCode: 201,
      body: JSON.stringify(newGameRoom),
    };
  } catch (error) {
    console.error("Unexpected error while creating game room for user", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
