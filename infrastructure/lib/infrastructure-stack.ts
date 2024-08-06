import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StateMachineStack } from "./stacks/state-machine";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stateMachineStack = new StateMachineStack(this, "StateMachineStack");
  }
}
