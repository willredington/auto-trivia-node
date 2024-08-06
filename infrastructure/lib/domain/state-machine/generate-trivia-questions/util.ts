import { Question, QuestionType } from "../../question";
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

export function mapTriviaQuestionsToQuestions(props: {
  triviaQuestions: TriviaQuestion[];
}): Question[] {
  return props.triviaQuestions.map((triviaQuestion) => ({
    question: triviaQuestion.question,
    options: triviaQuestion.choices,
    answer: triviaQuestion.answer,
    type: QuestionType.MULTIPLE_CHOICE,
  }));
}
