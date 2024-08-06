import { getRedisClient } from "./service";

export type RedisClient = ReturnType<typeof getRedisClient>;
