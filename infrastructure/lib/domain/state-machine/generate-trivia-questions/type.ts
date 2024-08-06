import { z } from "zod";

const TriviaQuestion = z.object({
  question: z.string(),
  choices: z.array(z.string()),
  answer: z.string(),
});

export type TriviaQuestion = z.infer<typeof TriviaQuestion>;

export const GenerateTriviaQuestionsInput = z.object({
  topic: z.string(),
  userId: z.string(),
  gameRoomCode: z.string(),
  questionsLength: z.unknown(),
  previousQuestions: z.array(TriviaQuestion).optional(),
});

export type GenerateTriviaQuestionsInput = z.infer<
  typeof GenerateTriviaQuestionsInput
>;

export const GenerateTriviaQuestionsOutput = z.object({
  questions: z.array(TriviaQuestion),
});

export type GenerateTriviaQuestionsOutput = z.infer<
  typeof GenerateTriviaQuestionsOutput
>;
