import { type DbClient } from "~/server/db";

export async function generateUniqueGameCode({
  dbClient,
  codeLen,
}: {
  dbClient: DbClient;
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

    const existingGameRoom = await dbClient.gameRoom.findUnique({
      where: { code: code },
    });

    if (!existingGameRoom) {
      return code;
    }

    iterations++;
  }

  throw new Error(
    `Failed to generate unique game code after ${maxIterations} iterations`,
  );
}
