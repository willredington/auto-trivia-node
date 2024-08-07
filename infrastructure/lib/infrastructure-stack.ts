import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StateMachineStack } from "./stacks/state-machine";
import { EventStack } from "./stacks/event";
import { GameRoomStack } from "./stacks/game-room";
import { ApiStack } from "./stacks/api";

type InfrastructureStackProps = cdk.StackProps & {
  cognitoUserPoolArn: string;
};

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const stateMachineStack = new StateMachineStack(this, "StateMachineStack");

    const eventStack = new EventStack(this, "EventStack", {
      generateTriviaQuestionsStateMachine:
        stateMachineStack.generateTriviaQuestionsStateMachine,
    });

    const gameRoomStack = new GameRoomStack(this, "GameRoomStack", {
      eventBus: eventStack.eventBus,
    });

    new ApiStack(this, "ApiStack", {
      cognitoUserPoolArn: props.cognitoUserPoolArn,
      createGameRoomLambda: gameRoomStack.createGameRoomLambda,
      getGameRoomByCodeLambda: gameRoomStack.getGameRoomByCodeLambda,
      getGameRoomByUserLambda: gameRoomStack.getGameRoomByUserLambda,
      joinGameRoomLambda: gameRoomStack.joinGameRoomLambda,
      startGameRoomLambda: gameRoomStack.startGameRoomLambda,
      nextQuestionLambda: gameRoomStack.nextQuestionLambda,
    });
  }
}
