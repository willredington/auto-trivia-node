import { z } from "zod";
import { RedisClient } from "../redis";
import { makeUserKey } from "./util";

export const UserGameRoomCodeEntry = z.string().optional();
