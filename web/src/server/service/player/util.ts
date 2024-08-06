import { randomBytes } from "crypto";

export const getPlayerSessionStoreKey = ({ token }: { token: string }) =>
  `player:${token}`;

export function generateToken() {
  return randomBytes(16).toString("hex");
}
