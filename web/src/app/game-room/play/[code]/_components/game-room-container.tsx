import { Badge } from "~/components/ui/badge";
import { type GameRoom } from "~/server/service/game";
import { Question } from "./question";
import { Loader2 } from "lucide-react";

export const GameRoomContainer = ({ gameRoom }: { gameRoom: GameRoom }) => {
  const activeQuestion = gameRoom.questions[gameRoom.currentQuestionIndex];

  if (!activeQuestion) {
    return (
      <div className="flex space-x-4">
        <p>Getting things ready...</p>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-2">
        <h2>Players</h2>
        {gameRoom.players.map((player) => (
          <Badge key={player.name}>{player.name}</Badge>
        ))}
      </div>
      <Question
        question={activeQuestion}
        questionIndex={gameRoom.currentQuestionIndex}
        gameRoomCode={gameRoom.code}
      />
    </div>
  );
};
