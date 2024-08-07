import { RedisClient } from "../redis";
import { randomBytes } from "crypto";

export function makeGameRoomKey({ gameRoomCode }: { gameRoomCode: string }) {
  return `gameRoom:${gameRoomCode}`;
}

export async function generateUniqueGameCode({
  redisClient,
  codeLen,
}: {
  redisClient: RedisClient;
  codeLen: number;
}): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;

  function generateGameCode() {
    let result = "";
    for (let i = 0; i < codeLen; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters[randomIndex];
    }
    return result;
  }

  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    const code = generateGameCode();

    const codeExists = await redisClient.exists(
      makeGameRoomKey({ gameRoomCode: code })
    );

    if (codeExists === 0) {
      return code;
    }

    iterations++;
  }

  throw new Error(
    `Failed to generate unique game code after ${maxIterations} iterations`
  );
}

export function generatePlayerToken() {
  const buffer = randomBytes(16);
  return buffer.toString("hex");
}
