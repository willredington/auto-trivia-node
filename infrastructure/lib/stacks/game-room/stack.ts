import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as events from "aws-cdk-lib/aws-events";
import { join } from "path";
import {
  BuildTimeEnvironmentVariable,
  getEnvironmentVariable,
} from "../../util/env";

const getLambdaRelativeDirPath = (lambdaName: string) => {
  return join(__dirname, "lambda", lambdaName);
};

type GameRoomStackProps = cdk.NestedStackProps & {
  eventBus: events.EventBus;
};

export class GameRoomStack extends cdk.NestedStack {
  public createGameRoomLambda: lambda.Function;
  public getGameRoomByCodeLambda: lambda.Function;
  public getGameRoomByUserLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: GameRoomStackProps) {
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

    this.createGameRoomLambda = new nodejs.NodejsFunction(
      this,
      "CreateGameRoomLambda",
      {
        entry: getLambdaRelativeDirPath("create-game-room.ts"),
        timeout: cdk.Duration.minutes(3),
        environment: {
          ...redisEnvs,
        },
      }
    );

    props.eventBus.grantPutEventsTo(this.createGameRoomLambda);

    this.getGameRoomByCodeLambda = new nodejs.NodejsFunction(
      this,
      "GetGameRoomByCodeLambda",
      {
        entry: getLambdaRelativeDirPath("get-game-room-by-code.ts"),
        timeout: cdk.Duration.minutes(3),
        environment: {
          ...redisEnvs,
        },
      }
    );

    this.getGameRoomByUserLambda = new nodejs.NodejsFunction(
      this,
      "GetGameRoomByUserLambda",
      {
        entry: getLambdaRelativeDirPath("get-game-room-by-user.ts"),
        timeout: cdk.Duration.minutes(3),
        environment: {
          ...redisEnvs,
        },
      }
    );
  }
}
