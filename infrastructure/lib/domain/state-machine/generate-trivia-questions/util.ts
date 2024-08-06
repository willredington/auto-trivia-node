import { Question } from "../../question";
import { TriviaQuestion } from "./type";

export function mapQuestionsToTriviaQuestions(props: {
  questions: Question[];
}): TriviaQuestion[] {
  return props.questions.map((question) => ({
    question: question.question,
    choices: question.options,
    answer: question.answer,
  }));
}
