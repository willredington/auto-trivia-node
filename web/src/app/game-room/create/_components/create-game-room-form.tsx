import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createGameRoom } from "~/server/service/game";

export const CreateGameRoomForm = async ({
  authToken,
}: {
  authToken: string;
}) => {
  const submitForm = async (formData: FormData) => {
    "use server";
    console.log("the data", formData.get("topic"));

    const topic = formData.get("topic") as string;

    if (topic) {
      await createGameRoom({
        authToken,
        input: {
          topic: formData.get("topic") as string,
        },
      });
    }
  };

  return (
    <form action={submitForm} className="space-y-4">
      <div className="grid w-full items-center gap-4">
        <Label htmlFor="topic">Topic</Label>
        <Input name="topic" id="topic" placeholder="US Presidents" />
      </div>
      <Button type="submit">Create</Button>
    </form>
  );
};
