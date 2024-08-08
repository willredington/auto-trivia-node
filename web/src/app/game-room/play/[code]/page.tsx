import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getGameRoomByCode } from "~/server/service/game";
import { hasPlayerTokenCookie } from "~/server/service/player";
import { GameRoomContainer } from "./_components/game-room-container";
import { JoinGameRoom } from "./_components/join-game-room";

export default async function GameRoomPlayByCodePage({
  params,
}: {
  params: { code: string };
}) {
  const gameRoom = await getGameRoomByCode({ gameRoomCode: params.code });

  if (!gameRoom) {
    notFound();
  }

  const playerTokenCookie = hasPlayerTokenCookie({
    gameRoomCode: gameRoom.code,
  });

  return (
    <div className="container flex justify-center">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle>{gameRoom.title ?? gameRoom.topic}</CardTitle>
        </CardHeader>
        <CardContent>
          {playerTokenCookie ? (
            <GameRoomContainer gameRoom={gameRoom} />
          ) : (
            <JoinGameRoom gameRoomCode={gameRoom.code} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
