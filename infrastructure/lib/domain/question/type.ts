import { z } from "zod";

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
}

const BaseQuestion = z.object({
  question: z.string(),
  type: z.nativeEnum(QuestionType),
});

export const MultipleChoiceQuestion = BaseQuestion.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  options: z.array(z.string()),
  answer: z.string(),
});

export const Question = MultipleChoiceQuestion;

export type Question = z.infer<typeof Question>;
