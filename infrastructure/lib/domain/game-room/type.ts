import { z } from "zod";
import { Question } from "../question";

export enum GameRoomStatus {
  IDLE = "IDLE",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  FAILED = "FAILED",
}

export const GameRoom = z.object({
  code: z.string(),
  topic: z.string(),
  players: z.array(z.string()),
  status: z.nativeEnum(GameRoomStatus),
  questions: z.array(Question),
  currentQuestionIndex: z.number(),
});

export type GameRoom = z.infer<typeof GameRoom>;
