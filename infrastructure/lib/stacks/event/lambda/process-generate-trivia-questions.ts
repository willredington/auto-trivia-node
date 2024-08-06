import { EventBridgeEvent } from "aws-lambda";
import {
  EventDetailType,
  GenerateTriviaQuestionsEventDetail,
} from "../../../domain/event";
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

type IncomingEventBridgeEvent = EventBridgeEvent<
  EventDetailType.GENERATE_TRIVIA_QUESTIONS,
  GenerateTriviaQuestionsEventDetail
>;

const ExpectedEventDetail = GenerateTriviaQuestionsEventDetail;

export const handler = async (event: IncomingEventBridgeEvent) => {
  console.log("event", JSON.stringify(event, null, 2));

  const { userId, gameRoomCode } = ExpectedEventDetail.parse(event.detail);

  try {
    const gameRoom = await getGameRoomForUser({
      redisClient,
      userId,
    });

    if (!gameRoom) {
      throw new Error("Game room not found");
    }

    if (gameRoom.code !== gameRoomCode) {
      throw new Error("Game room code does not match");
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
      throw new Error("Matching execution already running");
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

    console.log("start result", JSON.stringify(startResult, null, 2));
  } catch (error) {
    console.error(
      "Error starting generate trivia questions state machine",
      error
    );
  }
};
