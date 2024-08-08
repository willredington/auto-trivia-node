import { cookies } from "next/headers";

export const PLAYER_HEADER_TOKEN_NAME = "x-player-token";

export const makePlayerHeaderTokenForGameRoom = ({
  gameRoomCode,
}: {
  gameRoomCode: string;
}) => `player-header-token-${gameRoomCode}`;

export function hasPlayerTokenCookie({
  gameRoomCode,
}: {
  gameRoomCode: string;
}) {
  return cookies().has(makePlayerHeaderTokenForGameRoom({ gameRoomCode }));
}

export function getPlayerTokenCookieValue({
  gameRoomCode,
}: {
  gameRoomCode: string;
}) {
  const cookieValue = cookies().get(
    makePlayerHeaderTokenForGameRoom({ gameRoomCode }),
  );
  return cookieValue?.value;
}

export function setPlayerTokenCookie({
  gameRoomCode,
  token,
}: {
  gameRoomCode: string;
  token: string;
}) {
  cookies().set(makePlayerHeaderTokenForGameRoom({ gameRoomCode }), token);
}
