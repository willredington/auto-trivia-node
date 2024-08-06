import { z } from "zod";

const MultipleChoiceTriviaQuestion = z.object({
  question: z.string(),
  choices: z.array(z.string()),
  answer: z.string(),
});

export const TriviaQuestion = MultipleChoiceTriviaQuestion;

export type TriviaQuestion = z.infer<typeof TriviaQuestion>;
