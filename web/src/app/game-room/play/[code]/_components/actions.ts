"use server";

import { joinGameRoom } from "~/server/service/game";

export const joinGameRoomServerAction = async (props: {
  playerName: string;
  gameRoomCode: string;
}) => {
  await joinGameRoom({
    gameRoomCode: props.gameRoomCode,
    playerName: props.playerName,
  });
};
