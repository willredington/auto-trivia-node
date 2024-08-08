import axios from "axios";
import { env } from "~/env";
import { GameRoom } from "./type";

export const GAME_ROOM_API = `${env.API_ROOT_URL}/game-room`;

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
  const searchParams = new URLSearchParams({
    gameRoomCode,
  }).toString();

  const url = `${GAME_ROOM_API}/code?` + searchParams;

  console.log(url);

  const response = await fetch(url, {
    method: "GET",
    next: {
      revalidate: 15,
    },
  });

  console.log(response.status);

  if (response.status === 404) {
    return null;
  }

  return GameRoom.parse(await response.json());
}
