import { z } from "zod";

export enum EventSourceType {
  GAME_ROOM = "GAME_ROOM",
  TRIVIA_QUESTIONS = "TRIVIA_QUESTIONS",
}

export enum EventDetailType {
  UPDATE_GAME_ROOM = "UPDATE_GAME_ROOM",
  GENERATE_TRIVIA_QUESTIONS = "GENERATE_TRIVIA_QUESTIONS",
}

export const UpdateGameRoomEventDetail = z.object({
  gameRoomCode: z.string(),
  userId: z.string(),
});

export type UpdateGameRoomEventDetail = z.infer<
  typeof UpdateGameRoomEventDetail
>;

export const GenerateTriviaQuestionsEventDetail = z.object({
  gameRoomCode: z.string(),
});

export type GenerateTriviaQuestionsEventDetail = z.infer<
  typeof GenerateTriviaQuestionsEventDetail
>;
