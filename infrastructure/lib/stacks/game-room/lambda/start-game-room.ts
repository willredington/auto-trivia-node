import { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda";
import { z } from "zod";
import { extractUserIdFromClaims } from "../../../domain/auth";
import {
  GameRoomStatus,
  getGameRoomForUser,
  updateGameRoom,
} from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";

const redisClient = getRedisClient();

const ExpectedQueryParameters = z.object({
  gameRoomCode: z.string(),
});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  console.log("event", JSON.stringify(event, null, 2));

  const userId = extractUserIdFromClaims(
    event.requestContext.authorizer.claims
  );

  const queryParametersResult = ExpectedQueryParameters.safeParse(
    event.queryStringParameters
  );

  if (!queryParametersResult.success) {
    console.error("Invalid query parameters", queryParametersResult.error);
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Invalid parameters",
      },
    });
  }

  const { gameRoomCode } = queryParametersResult.data;

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

    if (gameRoom.code !== gameRoomCode) {
      console.error("Game room code does not match");
      return jsonResponse({
        statusCode: 403,
        body: {
          message: "Forbidden",
        },
      });
    }

    const updatedGameRoom = await updateGameRoom({
      gameRoomCode: gameRoom.code,
      redisClient,
      userId,
      input: {
        status: GameRoomStatus.IN_PROGRESS,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(updatedGameRoom),
    };
  } catch (error) {
    console.error("Unexpected error while updating game room", error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
