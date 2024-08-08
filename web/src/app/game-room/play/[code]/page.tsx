import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getGameRoomByCode } from "~/server/service/game";
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

  const hasPlayerTokenCookie = cookies().has("player-token");

  return (
    <div className="container flex justify-center">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle>{gameRoom.title ?? gameRoom.topic}</CardTitle>
          <CardDescription>
            Create and host your own trivia games on a wide range of topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPlayerTokenCookie ? (
            <div>Player is in the game</div>
          ) : (
            <JoinGameRoom gameRoomCode={gameRoom.code} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
