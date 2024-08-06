#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { config } from "dotenv";

config();

const app = new cdk.App();

new InfrastructureStack(app, "AutoTriviaDevStack", {
  cognitoUserPoolArn:
    "arn:aws:cognito-idp:us-east-2:992256429851:userpool/us-east-2_z8oE4aLQc",
});
