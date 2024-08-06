import { Redis } from "@upstash/redis";

export function getRedisClient() {
  return Redis.fromEnv();
}
