import { env } from "~/env";
import { GameRoom } from "./type";
import axios from "axios";
import { z } from "zod";

const GAME_ROOM_API = `${env.API_ROOT_URL}/game-room`;

export async function createGameRoom({
  authToken,
  input,
}: {
  authToken: string;
  input: { title?: string; topic: string };
}) {
  const response = await axios(`${GAME_ROOM_API}/create`, {
    method: "POST",
    data: input,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log("response", response.data);

  return GameRoom.parse(response.data);
}

export async function getGameRoomByCode({
  gameRoomCode,
}: {
  gameRoomCode: string;
}) {
  const response = await axios(`${GAME_ROOM_API}/code`, {
    method: "GET",
    validateStatus: (status) => status === 200 || status === 404,
    params: {
      gameRoomCode,
    },
  });

  if (response.status === 404) {
    return null;
  }

  return GameRoom.parse(response.data);
}

export async function joinGameRoom({
  gameRoomCode,
  playerName,
}: {
  gameRoomCode: string;
  playerName: string;
}): Promise<{ token: string }> {
  const response = await fetch(`${GAME_ROOM_API}/join`, {
    method: "POST",
    body: JSON.stringify({ name: playerName, gameRoomCode }),
  });

  if (response.status === 404) {
    throw new Error("Game room not found");
  }

  if (!response.ok) {
    throw new Error("Failed to join game room");
  }

  return z
    .object({
      token: z.string(),
    })
    .parse(await response.json());
}
