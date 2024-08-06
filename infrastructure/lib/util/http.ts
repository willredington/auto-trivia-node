import { APIGatewayProxyResult } from "aws-lambda";

export const JSON_HTTP_HEADERS = {
  "Content-Type": "application/json",
};

export function jsonResponse<T = unknown>({
  statusCode,
  body,
}: {
  statusCode: number;
  body: T | Record<string, unknown>;
}): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: JSON_HTTP_HEADERS,
  };
}
