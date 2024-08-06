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
  UpdateGameRoomEventDetail,
} from "./types";

const scheduler = new SchedulerClient();

function sanitizeScheduleName(scheduleName: string) {
  return scheduleName.toLocaleLowerCase().replace(/[^0-9a-zA-Z-_.]+/g, "_");
}

export async function createSchedule<T>({
  eventSource,
  eventDetail,
  rateInSeconds,
  entity,
  key,
}: {
  eventSource: EventSourceType;
  eventDetail: EventDetailType;
  rateInSeconds: number;
  entity: T;
  key: string;
}) {
  return await scheduler.send(
    new CreateScheduleCommand({
      Name: key,
      ScheduleExpression: `rate(${rateInSeconds} seconds)`,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Input: JSON.stringify(entity),
        EventBridgeParameters: {
          Source: eventSource,
          DetailType: eventDetail,
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
  event,
}: {
  event: UpdateGameRoomEventDetail;
}) {
  return await createSchedule({
    eventSource: EventSourceType.GAME_ROOM,
    eventDetail: EventDetailType.UPDATE_GAME_ROOM,
    entity: event,
    rateInSeconds: 15,
    key: createUpdateGameRoomScheduleKey({
      gameRoomCode: event.gameRoomCode,
    }),
  });
}
