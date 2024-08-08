import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { joinGameRoom, setPlayerTokenCookie } from "~/server/service/player";

export const JoinGameRoom = ({ gameRoomCode }: { gameRoomCode: string }) => {
  const submitForm = async (formData: FormData) => {
    "use server";

    const formDataSchema = z.object({
      playerName: z.string(),
    });

    const validatedSchemaResult = formDataSchema.safeParse({
      playerName: formData.get("playerName"),
    });

    if (!validatedSchemaResult.success) {
      return {
        errors: validatedSchemaResult.error.flatten().fieldErrors,
      };
    }

    const { playerName } = validatedSchemaResult.data;

    const { token } = await joinGameRoom({
      gameRoomCode,
      playerName,
    });

    setPlayerTokenCookie({ gameRoomCode, token });

    revalidatePath(`/game-room/play/${gameRoomCode}`);
  };

  return (
    <form action={submitForm} className="space-y-4">
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="playerName">Player Name</Label>
        <Input name="playerName" id="playerName" />
      </div>
      <Button type="submit">Join</Button>
    </form>
  );
};
