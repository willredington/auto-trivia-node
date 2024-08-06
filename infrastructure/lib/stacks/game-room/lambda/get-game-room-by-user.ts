import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { extractUserIdFromClaims } from "../../../domain/auth";
import { getGameRoomForUser } from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";

const redisClient = getRedisClient();

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  const userId = extractUserIdFromClaims(
    event.requestContext.authorizer.claims
  );

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify(gameRoom),
    };
  } catch (error) {
    console.error("Unexpected error while fetching game room for user", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
