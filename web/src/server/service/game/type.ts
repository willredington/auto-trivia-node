import { z } from "zod";

enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
}

const BaseQuestion = z.object({
  question: z.string(),
  type: z.nativeEnum(QuestionType),
});

const MultipleChoiceQuestion = BaseQuestion.extend({
  type: z.literal(QuestionType.MULTIPLE_CHOICE),
  options: z.array(z.string()),
  answer: z.string(),
});

const Question = MultipleChoiceQuestion;

enum GameRoomStatus {
  IDLE = "IDLE",
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

const Player = z.object({
  name: z.string(),
  token: z.string(),
  score: z.number(),
  answers: z.record(z.number(), z.string()),
});

export const GameRoom = z.object({
  code: z.string(),
  title: z.string(),
  topic: z.string(),
  ownerId: z.string(),
  maxPlayerCount: z.number(),
  players: z.array(Player),
  status: z.nativeEnum(GameRoomStatus),
  questions: z.array(Question),
  failureReason: z.string().optional(),
  currentQuestionIndex: z.number(),
});

export type GameRoom = z.infer<typeof GameRoom>;
