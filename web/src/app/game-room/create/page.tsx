import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { CreateGameRoomForm } from "./_components/create-game-room-form";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { GameRoomContainer } from "../play/[code]/_components/game-room-container";
import { JoinGameRoom } from "../play/[code]/_components/join-game-room";

export default async function GameRoomCreatePage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container flex justify-center">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle>Create Game Room</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateGameRoomForm authToken={session.idToken} />
        </CardContent>
      </Card>
    </div>
  );
}
