import { GAME_ROOM_API } from "../game";
import { PlayerToken } from "./type";
import { PLAYER_HEADER_TOKEN_NAME } from "./util";

export async function joinGameRoom({
  gameRoomCode,
  playerName,
}: {
  gameRoomCode: string;
  playerName: string;
}): Promise<PlayerToken> {
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

  return PlayerToken.parse(await response.json());
}

export async function recordAnswer({
  gameRoomCode,
  playerToken,
  questionIndex,
  answer,
}: {
  gameRoomCode: string;
  playerToken: string;
  questionIndex: number;
  answer: string;
}) {
  const response = await fetch(`${GAME_ROOM_API}/record`, {
    method: "POST",
    body: JSON.stringify({ gameRoomCode, questionIndex, answer }),
    headers: {
      [PLAYER_HEADER_TOKEN_NAME]: playerToken,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to record answer");
  }
}
