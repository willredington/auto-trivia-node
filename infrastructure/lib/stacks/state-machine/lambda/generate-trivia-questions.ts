import { OpenAI } from "@langchain/openai";
import { Handler } from "aws-lambda";
import * as hub from "langchain/hub";
import {
  GenerateTriviaQuestionsInput,
  GenerateTriviaQuestionsOutput,
} from "../../../domain/state-machine/generate-trivia-questions";
import {
  BuildTimeEnvironmentVariable,
  getEnvironmentVariable,
} from "../../../util/env";

const GENERATE_TRIVIA_PROMPT_ID = "sagemaster/trivia_generator";

const llm = new OpenAI({
  model: "gpt-4o",
  timeout: 1000 * 60 * 3, // 3 minutes
  apiKey: getEnvironmentVariable(BuildTimeEnvironmentVariable.OPENAI_API_KEY),
});

export const handler: Handler = async (
  incomingEvent
): Promise<GenerateTriviaQuestionsOutput> => {
  const event = GenerateTriviaQuestionsInput.parse(incomingEvent);

  const generateTriviaPrompt = await hub.pull(GENERATE_TRIVIA_PROMPT_ID);

  const response = await generateTriviaPrompt.pipe(llm).invoke({
    topic: event.topic,
    questionsLength: event.questionsLength,
    previousQuestions: JSON.stringify(event.previousQuestions),
  });

  console.log("response", JSON.stringify(response, null, 2));

  let json = response;

  try {
    json = JSON.parse(response);
  } catch (err) {
    console.warn("Failed to parse as JSON", response);
  }

  return GenerateTriviaQuestionsOutput.parse(json);
};
