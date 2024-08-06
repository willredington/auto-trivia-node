import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import {
  BuildTimeEnvironmentVariable,
  getEnvironmentVariable,
} from "../../util/env";

const getLambdaRelativeDirPath = (lambdaName: string) => {
  return join(__dirname, "lambda", lambdaName);
};

type GameRoomStackProps = cdk.NestedStackProps;

export class GameRoomStack extends cdk.NestedStack {
  public getGameRoomByCodeLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: GameRoomStackProps) {
    super(scope, id, props);

    this.getGameRoomByCodeLambda = new nodejs.NodejsFunction(
      this,
      "GetGameRoomByCodeLambda",
      {
        entry: getLambdaRelativeDirPath("get-game-room-by-code.ts"),
        timeout: cdk.Duration.minutes(3),
        environment: {
          [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL]:
            getEnvironmentVariable(
              BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_URL
            ),
          [BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN]:
            getEnvironmentVariable(
              BuildTimeEnvironmentVariable.UPSTASH_REDIS_REST_TOKEN
            ),
        },
      }
    );
  }
}
