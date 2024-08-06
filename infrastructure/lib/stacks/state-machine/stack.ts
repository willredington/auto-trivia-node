import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import { join } from "path";
import {
  BuildTimeEnvironmentVariable,
  getEnvironmentVariable,
} from "../../util/env";

const getLambdaRelativeDirPath = (lambdaName: string) => {
  return join(__dirname, "lambda", lambdaName);
};

type StateMachineStackProps = cdk.NestedStackProps;

export class StateMachineStack extends cdk.NestedStack {
  public generateTriviaQuestionsStateMachine: sf.StateMachine;

  constructor(scope: Construct, id: string, props?: StateMachineStackProps) {
    super(scope, id, props);

    const redisEnvs = {
      [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL]:
        getEnvironmentVariable(
          BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL
        ),
      [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN]:
        getEnvironmentVariable(
          BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN
        ),
    };

    const updateGameRoomLambda = new nodejs.NodejsFunction(
      this,
      "UpdateGameRoomLambda",
      {
        entry: getLambdaRelativeDirPath("update-game-room.ts"),
        timeout: cdk.Duration.minutes(5),
        environment: {
          ...redisEnvs,
        },
      }
    );

    const generateTriviaQuestionsLambda = new nodejs.NodejsFunction(
      this,
      "GenerateTriviaQuestionsLambda",
      {
        entry: getLambdaRelativeDirPath("generate-trivia-questions.ts"),
        timeout: cdk.Duration.minutes(5),
        environment: {
          [BuildTimeEnvironmentVariable.OPENAI_API_KEY]: getEnvironmentVariable(
            BuildTimeEnvironmentVariable.OPENAI_API_KEY
          ),
        },
      }
    );

    this.generateTriviaQuestionsStateMachine =
      createGenerateTriviaQuestionsStateMachine({
        scope: this,
        updateGameRoomLambda,
        generateTriviaQuestionsLambda,
      });
  }
}

function createGenerateTriviaQuestionsStateMachine({
  scope,
  updateGameRoomLambda,
  generateTriviaQuestionsLambda,
}: {
  scope: Construct;
  updateGameRoomLambda: lambda.Function;
  generateTriviaQuestionsLambda: lambda.Function;
}) {
  const generateTriviaQuestionsTask = new tasks.LambdaInvoke(
    scope,
    "GenerateTriviaQuestionsTask",
    {
      lambdaFunction: generateTriviaQuestionsLambda,
      resultPath: "$.triviaQuestions",
    }
  ).addRetry({
    maxAttempts: 3,
  });

  const updateGameRoomTask = new tasks.LambdaInvoke(
    scope,
    "UpdateGameRoomTask",
    {
      lambdaFunction: updateGameRoomLambda,
      payload: sf.TaskInput.fromObject({
        userId: sf.JsonPath.stringAt("$.userId"),
        gameRoomCode: sf.JsonPath.stringAt("$.gameRoomCode"),
        triviaQuestions: sf.JsonPath.objectAt("$.triviaQuestions.Payload"),
      }),
    }
  ).addRetry({
    maxAttempts: 3,
  });

  const stateMachineDefinition = sf.DefinitionBody.fromChainable(
    generateTriviaQuestionsTask.next(updateGameRoomTask)
  );

  return new sf.StateMachine(scope, "GenerateTriviaQuestionsStateMachine", {
    definitionBody: stateMachineDefinition,
  });
}
