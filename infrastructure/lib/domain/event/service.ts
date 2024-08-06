import {
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import {
  getEnvironmentVariable,
  RuntimeEnvironmentVariable,
} from "../../util/env";
import {
  EventDetailType,
  EventSourceType,
  GenerateTriviaQuestionsEventDetail,
  UpdateGameRoomEventDetail,
} from "./types";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

function sanitizeScheduleName(scheduleName: string) {
  return scheduleName.toLocaleLowerCase().replace(/[^0-9a-zA-Z-_.]+/g, "_");
}

export async function createSchedule<T>({
  scheduler,
  input,
}: {
  scheduler: SchedulerClient;
  input: {
    eventSource: EventSourceType;
    eventDetail: EventDetailType;
    rateInSeconds: number;
    entity: T;
    key: string;
  };
}) {
  return await scheduler.send(
    new CreateScheduleCommand({
      Name: input.key,
      ScheduleExpression: `rate(${input.rateInSeconds} seconds)`,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Input: JSON.stringify(input.entity),
        EventBridgeParameters: {
          Source: input.eventSource,
          DetailType: input.eventDetail,
        },
        Arn: getEnvironmentVariable(RuntimeEnvironmentVariable.EVENT_BUS_ARN),
        RoleArn: getEnvironmentVariable(
          RuntimeEnvironmentVariable.SCHEDULER_ROLE_ARN
        ),
      },
    })
  );
}

export function createUpdateGameRoomScheduleKey({
  gameRoomCode,
}: {
  gameRoomCode: string;
}) {
  return sanitizeScheduleName(`update-game-room-${gameRoomCode}`);
}

export async function createUpdateGameRoomSchedule({
  scheduler,
  event,
}: {
  scheduler: SchedulerClient;
  event: UpdateGameRoomEventDetail;
}) {
  return await createSchedule({
    scheduler,
    input: {
      eventSource: EventSourceType.GAME_ROOM,
      eventDetail: EventDetailType.UPDATE_GAME_ROOM,
      entity: event,
      rateInSeconds: 15,
      key: createUpdateGameRoomScheduleKey({
        gameRoomCode: event.gameRoomCode,
      }),
    },
  });
}

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
        },
      ],
    })
  );
}
