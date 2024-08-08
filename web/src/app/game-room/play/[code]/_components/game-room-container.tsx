import { Badge } from "~/components/ui/badge";
import { type GameRoom } from "~/server/service/game";
import { Question } from "./question";

export const GameRoomContainer = ({ gameRoom }: { gameRoom: GameRoom }) => {
  const activeQuestion = gameRoom.questions[gameRoom.currentQuestionIndex];

  if (!activeQuestion) {
    return <div>Getting things ready...</div>;
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
