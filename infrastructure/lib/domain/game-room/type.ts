import { z } from "zod";
import { Question } from "../question";

export enum GameRoomStatus {
  IDLE = "IDLE",
  READY = "READY",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

export const Player = z.object({
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
