import { APIGatewayProxyHandler } from "aws-lambda";
import { z } from "zod";
import { getGameRoomByCode } from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import { jsonResponse } from "../../../util/http";

const redisClient = getRedisClient();

const ExpectedQueryParameters = z.object({
  gameRoomCode: z.string(),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", JSON.stringify(event, null, 2));

  const queryParametersResult = ExpectedQueryParameters.safeParse(
    event.queryStringParameters
  );

  if (!queryParametersResult.success) {
    console.error("Invalid query parameters", queryParametersResult.error);
    return jsonResponse({
      statusCode: 400,
      body: {
        message: "Invalid query parameters",
      },
    });
  }

  const { gameRoomCode } = queryParametersResult.data;

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

    return jsonResponse({
      statusCode: 200,
      body: gameRoom,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      statusCode: 500,
      body: {
        message: "Unexpected error",
      },
    });
  }
};
