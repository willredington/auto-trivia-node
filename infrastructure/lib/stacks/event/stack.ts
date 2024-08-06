import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sf from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { join } from "path";
import { EventDetailType, EventSourceType } from "../../domain/event";
import {
  BuildTimeEnvironmentVariable,
  getEnvironmentVariable,
  RuntimeEnvironmentVariable,
} from "../../util/env";

const getLambdaRelativeDirPath = (lambdaName: string) => {
  return join(__dirname, "lambda", lambdaName);
};

export type EventStackProps = cdk.NestedStackProps & {
  generateTriviaQuestionsStateMachine: sf.StateMachine;
};

export class EventStack extends cdk.NestedStack {
  public eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props: EventStackProps) {
    super(scope, id, props);

    this.eventBus = new events.EventBus(this, "EventBus");

    const processGenerateTriviaQuestionsLambda = new nodejs.NodejsFunction(
      this,
      "ProcessGenerateTriviaQuestionsLambda",
      {
        entry: getLambdaRelativeDirPath("process-generate-trivia-questions.ts"),
        environment: {
          [RuntimeEnvironmentVariable.GENERATE_TRIVIA_QUESTIONS_STATE_MACHINE_ARN]:
            props.generateTriviaQuestionsStateMachine.stateMachineArn,
          [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL]:
            getEnvironmentVariable(
              BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL
            ),
          [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN]:
            getEnvironmentVariable(
              BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN
            ),
        },
        timeout: cdk.Duration.minutes(3),
      }
    );

    props.generateTriviaQuestionsStateMachine.grant(
      processGenerateTriviaQuestionsLambda,
      "states:StartExecution",
      "states:DescribeExecution",
      "states:ListExecutions"
    );

    new events.Rule(this, "GenerateTriviaQuestionsEventRule", {
      eventBus: this.eventBus,
      eventPattern: {
        source: [EventSourceType.TRIVIA_QUESTIONS],
        detailType: [EventDetailType.GENERATE_TRIVIA_QUESTIONS],
      },
    }).addTarget(
      new eventTargets.LambdaFunction(processGenerateTriviaQuestionsLambda)
    );
  }
}
