import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { extractUserIdFromClaims } from "../../../domain/auth";
import { createGameRoom, getGameRoomForUser } from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";

const redisClient = getRedisClient();

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
