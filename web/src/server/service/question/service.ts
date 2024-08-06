import { OpenAI } from "@langchain/openai";
import * as hub from "langchain/hub";
import { env } from "~/env";
import { type DbClient } from "~/server/db";
import { TriviaQuestion } from "./type";

const GENERATE_TRIVIA_PROMPT_ID = "sagemaster/trivia_generator";

const llm = new OpenAI({
  model: "gpt-4o-mini",
  timeout: 1000 * 60 * 1, //  minutes
  apiKey: env.OPENAI_API_KEY,
});

export async function generateNextTriviaQuestion({
  topic,
  previousQuestions,
}: {
  topic: string;
  previousQuestions: TriviaQuestion[];
}) {
  const generateTriviaPrompt = await hub.pull(GENERATE_TRIVIA_PROMPT_ID);

  const response = await generateTriviaPrompt.pipe(llm).invoke({
    topic,
    previousQuestions,
  });

  console.log("response", JSON.stringify(response, null, 2));

  let json: unknown = response;

  try {
    json = JSON.parse(response);
  } catch (err) {
    console.warn("Failed to parse as JSON", response);
  }

  return TriviaQuestion.parse(json);
}

export async function getPreviousQuestions({
  dbClient,
  gameRoomId,
}: {
  dbClient: DbClient;
  gameRoomId: string;
}): Promise<TriviaQuestion[]> {
  const questions = await dbClient.question.findMany({
    where: { gameRoomId },
    select: {
      text: true,
      multipleChoiceQuestion: true,
    },
  });

  return questions
    .filter((question) => question.multipleChoiceQuestion !== null)
    .map((question) => {
      return {
        question: question.text,
        choices: question.multipleChoiceQuestion!.options,
        answer: question.multipleChoiceQuestion!.answer,
      };
    });
}
