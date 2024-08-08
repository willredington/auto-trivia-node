import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { type Question as QuestionType } from "~/server/service/game";
import {
  getPlayerTokenCookieValue,
  recordAnswer,
} from "~/server/service/player";

export const Question = ({
  gameRoomCode,
  questionIndex,
  question: questionItem,
}: {
  gameRoomCode: string;
  questionIndex: number;
  question: QuestionType;
}) => {
  const handleSubmit = async (formData: FormData) => {
    "use server";

    const formSchema = z.object({
      choice: z.string(),
    });

    const validationResult = formSchema.safeParse({
      choice: formData.get("choice"),
    });

    if (!validationResult.success) {
      console.log(validationResult.error);
      return {
        error: validationResult.error.flatten().formErrors,
      };
    }

    const { choice } = validationResult.data;

    const playerToken = getPlayerTokenCookieValue({
      gameRoomCode,
    });

    if (!playerToken) {
      return {
        error: "Player token not found",
      };
    }

    await recordAnswer({
      gameRoomCode,
      playerToken,
      questionIndex,
      answer: choice,
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <p className="text-large font-semibold">{questionItem.question}</p>
      <form action={handleSubmit} className="space-y-4">
        <RadioGroup name="choice" required>
          {questionItem.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-4">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
};
