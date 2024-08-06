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
        generateTriviaQuestionsLambda,
      });
  }
}

function createGenerateTriviaQuestionsStateMachine({
  scope,
  generateTriviaQuestionsLambda,
}: {
  scope: Construct;
  generateTriviaQuestionsLambda: lambda.Function;
}) {
  const generateTriviaQuestionsTask = new tasks.LambdaInvoke(
    scope,
    "GenerateTriviaQuestionsTask",
    {
      lambdaFunction: generateTriviaQuestionsLambda,
    }
  ).addRetry({
    maxAttempts: 3,
  });

  const stateMachineDefinition = sf.DefinitionBody.fromChainable(
    generateTriviaQuestionsTask
  );

  return new sf.StateMachine(scope, "GenerateTriviaQuestionsStateMachine", {
    definitionBody: stateMachineDefinition,
  });
}
