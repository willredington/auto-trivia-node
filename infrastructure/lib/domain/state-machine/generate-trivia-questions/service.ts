import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

import {
  getEnvironmentVariable,
  RuntimeEnvironmentVariable,
} from "../../../util/env";
import { findRunningMatchingInputsForStateMachine } from "../service";
import { GenerateTriviaQuestionsInput } from "./type";

const stepFunctionClient = new SFNClient();

export async function findRunningMatchingGenerateTriviaExecution({
  input,
}: {
  input: GenerateTriviaQuestionsInput;
}) {
  const isInputEqual = (
    actualInput: GenerateTriviaQuestionsInput,
    inputToValidate: GenerateTriviaQuestionsInput
  ) => {
    return (
      actualInput.topic === inputToValidate.topic &&
      actualInput.userId === inputToValidate.userId &&
      actualInput.gameRoomCode === inputToValidate.gameRoomCode
    );
  };

  return await findRunningMatchingInputsForStateMachine({
    isInputEqual,
    inputsToValidate: [input],
    inputSchema: GenerateTriviaQuestionsInput,
    stateMachineArn: getEnvironmentVariable(
      RuntimeEnvironmentVariable.GENERATE_TRIVIA_QUESTIONS_STATE_MACHINE_ARN
    ),
  });
}

export async function startGenerateTriviaQuestionsStateMachine({
  input,
  generateTriviaQuestionsStateMachineArn,
}: {
  input: GenerateTriviaQuestionsInput;
  generateTriviaQuestionsStateMachineArn: string;
}) {
  const startResult = await stepFunctionClient.send(
    new StartExecutionCommand({
      stateMachineArn: generateTriviaQuestionsStateMachineArn,
      input: JSON.stringify(input),
    })
  );

  console.log(
    `started generate trivia questions state machine with input: ${JSON.stringify(
      input
    )}`
  );

  return startResult;
}
