import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { ZodSchema, z } from "zod";

export class DynamoDBService<T> {
  private readonly itemSchema: ZodSchema<T>;
  private readonly docClient: DynamoDBDocumentClient;

  constructor({ schema }: { schema: ZodSchema<T> }) {
    this.itemSchema = schema;
    this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient());
  }

  async queryOne(params: GetCommandInput): Promise<T | null> {
    try {
      const result = await this.docClient.send(new GetCommand(params));

      if (!result.Item) {
        return null;
      }

      return this.itemSchema.parse(result.Item);
    } catch (error) {
      console.error("Error during queryOne operation:", error);
      throw error;
    }
  }

  async exhaustiveQuery({
    queryInput,
  }: {
    queryInput: QueryCommandInput;
  }): Promise<T[]> {
    const results: T[] = [];

    try {
      let lastEvaluatedKey: QueryCommandOutput["LastEvaluatedKey"];

      do {
        const page = await this.docClient.send(
          new QueryCommand({
            ...queryInput,
            ExclusiveStartKey: lastEvaluatedKey,
          })
        );

        const items = z.array(this.itemSchema).parse(page.Items ?? []);
        results.push(...items);

        page.LastEvaluatedKey && (lastEvaluatedKey = page.LastEvaluatedKey);
      } while (lastEvaluatedKey);
    } catch (error) {
      console.error("Error during query pagination:", error);
      throw error;
    }

    return results;
  }

  async put(params: PutCommandInput): Promise<PutCommandOutput> {
    try {
      return await this.docClient.send(new PutCommand(params));
    } catch (error) {
      console.error("Error during put operation:", error);
      throw error;
    }
  }

  async update(params: UpdateCommandInput): Promise<UpdateCommandOutput> {
    try {
      return await this.docClient.send(new UpdateCommand(params));
    } catch (error) {
      console.error("Error during update operation:", error);
      throw error;
    }
  }

  async delete(params: DeleteCommandInput): Promise<DeleteCommandOutput> {
    try {
      return await this.docClient.send(new DeleteCommand(params));
    } catch (error) {
      console.error("Error during delete operation:", error);
      throw error;
    }
  }
}
