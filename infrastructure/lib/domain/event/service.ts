import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import {
  getEnvironmentVariable,
  RuntimeEnvironmentVariable,
} from "../../util/env";
import {
  EventDetailType,
  EventSourceType,
  GenerateTriviaQuestionsEventDetail,
} from "./types";

export async function emitEvent<T>({
  client,
  input,
}: {
  client: EventBridgeClient;
  input: {
    event: T;
    eventDetail: EventDetailType;
    eventSource: EventSourceType;
  };
}) {
  return await client.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: input.eventSource,
          DetailType: input.eventDetail,
          Detail: JSON.stringify(input.event),
        },
      ],
    })
  );
}

export async function triggerGenerateTriviaQuestionsEvent({
  client,
  input,
}: {
  client: EventBridgeClient;
  input: GenerateTriviaQuestionsEventDetail;
}) {
  return await client.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: EventSourceType.TRIVIA_QUESTIONS,
          DetailType: EventDetailType.GENERATE_TRIVIA_QUESTIONS,
          Detail: JSON.stringify(input),
          EventBusName: getEnvironmentVariable(
            RuntimeEnvironmentVariable.EVENT_BUS_NAME
          ),
        },
      ],
    })
  );
}
