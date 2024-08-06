import { z } from "zod";

export enum BuildTimeEnvironmentVariable {
  OPENAI_API_KEY = "OPENAI_API_KEY",
  UPSTASH_REDIS_REST_URL = "UPSTASH_REDIS_REST_URL",
  UPSTASH_REDIS_REST_TOKEN = "UPSTASH_REDIS_REST_TOKEN",
}

export enum RuntimeEnvironmentVariable {
  EVENT_BUS_ARN = "EVENT_BUS_ARN",
  EVENT_BUS_NAME = "EVENT_BUS_NAME",
  GENERATE_TRIVIA_QUESTIONS_STATE_MACHINE_ARN = "GENERATE_TRIVIA_QUESTIONS_STATE_MACHINE_ARN",
}

export type AppEnvironmentVariable =
  | BuildTimeEnvironmentVariable
  | RuntimeEnvironmentVariable;

export function getEnvironmentVariable(envVar: AppEnvironmentVariable) {
  try {
    return z.string().parse(process.env[envVar]);
  } catch {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
}
