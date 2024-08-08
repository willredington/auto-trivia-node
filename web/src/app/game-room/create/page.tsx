import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { CreateGameRoomForm } from "./_components/create-game-room-form";

export default async function GameRoomCreatePage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container flex justify-center">
      <CreateGameRoomForm authToken={session.idToken} />
    </div>
  );
}
