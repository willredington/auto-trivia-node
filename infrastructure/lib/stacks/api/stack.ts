import * as cdk from "aws-cdk-lib";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export type ApiStackProps = cdk.NestedStackProps & {
  cognitoUserPoolArn: string;
  createGameRoomLambda: lambda.Function;
  startGameRoomLambda: lambda.Function;
  joinGameRoomLambda: lambda.Function;
  getGameRoomByCodeLambda: lambda.Function;
  getGameRoomByUserLambda: lambda.Function;
  nextQuestionLambda: lambda.Function;
  recordAnswerLambda: lambda.Function;
};

export class ApiStack extends cdk.NestedStack {
  public api: apig.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.api = new apig.RestApi(this, "Api");

    const cognitoUserPool = cognito.UserPool.fromUserPoolArn(
      this,
      "CognitoUserPool",
      props.cognitoUserPoolArn
    );

    const appAuthorizer = new apig.CognitoUserPoolsAuthorizer(
      this,
      "Authorizer",
      {
        cognitoUserPools: [cognitoUserPool],
      }
    );

    const gameRoomResource = this.api.root.addResource("game-room");

    gameRoomResource
      .addResource("create")
      .addMethod(
        "POST",
        new apig.LambdaIntegration(props.createGameRoomLambda),
        {
          authorizer: appAuthorizer,
        }
      );

    gameRoomResource
      .addResource("start")
      .addMethod(
        "POST",
        new apig.LambdaIntegration(props.startGameRoomLambda),
        {
          authorizer: appAuthorizer,
        }
      );

    gameRoomResource
      .addResource("user")
      .addMethod(
        "GET",
        new apig.LambdaIntegration(props.getGameRoomByUserLambda),
        {
          authorizer: appAuthorizer,
        }
      );

    // unauthenticated
    gameRoomResource
      .addResource("code")
      .addMethod(
        "GET",
        new apig.LambdaIntegration(props.getGameRoomByCodeLambda)
      );

    gameRoomResource
      .addResource("join")
      .addMethod("POST", new apig.LambdaIntegration(props.joinGameRoomLambda));

    gameRoomResource
      .addResource("record")
      .addMethod("POST", new apig.LambdaIntegration(props.recordAnswerLambda));
  }
}
