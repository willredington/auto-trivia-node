import {
  DescribeExecutionCommand,
  ListExecutionsCommand,
  SFNClient,
} from "@aws-sdk/client-sfn";
import { SafeParseReturnType, ZodSchema } from "zod";

const stepFunctionClient = new SFNClient();

export async function findRunningMatchingInputsForStateMachine<T>({
  stateMachineArn,
  isInputEqual,
  inputSchema,
  inputsToValidate,
}: {
  stateMachineArn: string;
  isInputEqual: (actualInput: T, inputToValidate: T) => boolean;
  inputSchema: ZodSchema<T>;
  inputsToValidate: T[];
}): Promise<T[]> {
  const executionInputParseResultPromises: Promise<
    SafeParseReturnType<T, T>
  >[] = [];

  let nextToken;

  // get all running executions and parse their inputs
  do {
    const listRunningExecutionResults = await stepFunctionClient.send(
      new ListExecutionsCommand({
        nextToken,
        stateMachineArn,
        statusFilter: "RUNNING",
      })
    );

    for (const runningExecution of listRunningExecutionResults.executions ??
      []) {
      const executionInputParseResultPromise = async (): Promise<
        SafeParseReturnType<T, T>
      > => {
        const executionDescription = await stepFunctionClient.send(
          new DescribeExecutionCommand({
            executionArn: runningExecution.executionArn,
          })
        );

        return inputSchema.safeParse(executionDescription.input);
      };

      executionInputParseResultPromises.push(
        executionInputParseResultPromise()
      );
    }
  } while (nextToken);

  const executionInputParseResults = await Promise.all(
    executionInputParseResultPromises
  );

  const matchingInputs: T[] = [];

  // find non-matching inputs
  for (const executionInputParseResult of executionInputParseResults) {
    if (executionInputParseResult.success) {
      const executionInput = executionInputParseResult.data;

      const matchingInput = inputsToValidate.find((inputToValidate) =>
        isInputEqual(executionInput, inputToValidate)
      );

      if (matchingInput) {
        matchingInputs.push(executionInput);
      }
    }
  }

  return matchingInputs;
}
