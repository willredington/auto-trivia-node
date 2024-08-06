import { z } from "zod";

export enum EventSourceType {
  TRIVIA_QUESTIONS = "TRIVIA_QUESTIONS",
}

export enum EventDetailType {
  GENERATE_TRIVIA_QUESTIONS = "GENERATE_TRIVIA_QUESTIONS",
}

export const GenerateTriviaQuestionsEventDetail = z.object({
  userId: z.string(),
  gameRoomCode: z.string(),
});

export type GenerateTriviaQuestionsEventDetail = z.infer<
  typeof GenerateTriviaQuestionsEventDetail
>;
