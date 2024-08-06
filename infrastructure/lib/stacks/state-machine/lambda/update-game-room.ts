import { Handler } from "aws-lambda";
import {
  GameRoomStatus,
  updateGameRoomByUserId,
} from "../../../domain/game-room";
import { getRedisClient } from "../../../domain/redis";
import {
  mapTriviaQuestionsToQuestions,
  UpdateGameRoomInput,
} from "../../../domain/state-machine/generate-trivia-questions";

const redisClient = getRedisClient();

export const handler: Handler = async (incomingEvent) => {
  console.log("incomingEvent", JSON.stringify(incomingEvent, null, 2));

  const event = UpdateGameRoomInput.parse(incomingEvent);

  return await updateGameRoomByUserId({
    redisClient,
    userId: event.userId,
    input: {
      status: GameRoomStatus.FINISHED,
      questions: mapTriviaQuestionsToQuestions({
        triviaQuestions: event.triviaQuestions.questions,
      }),
    },
  });
};
