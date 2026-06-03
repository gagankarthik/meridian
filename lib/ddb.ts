import "server-only";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { awsCredentials } from "@/lib/aws-credentials";

/**
 * Single-table DynamoDB access. Every workspace's data lives under one
 * partition (PK = WS#<workspaceId>) so the whole workspace loads in one Query.
 * A `byEmail` GSI resolves invited members before they have a Cognito sub.
 *
 * Item shapes (all carry a `type` field for partitioning client-side):
 *   USER#<sub>      / PROFILE         → { workspaceId, userId, email, role, ... }
 *   WS#<wid>        / META            → { name, plan, ownerId }
 *   WS#<wid>        / MEMBER#<userId> → member
 *   WS#<wid>        / PROJECT#<pid>   → project
 *   WS#<wid>        / TASK#<tid>      → task
 *   WS#<wid>        / COLUMN#<cid>    → column
 */
export const DDB_TABLE =
  process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME ??
  process.env.DDB_TABLE ??
  "meridian";
export const AWS_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION ?? process.env.AWS_REGION ?? "us-east-1";

/** True once a table name is configured (creds come from the AWS chain). */
export const ddbConfigured = Boolean(
  process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME ?? process.env.DDB_TABLE,
);

let _doc: DynamoDBDocument | null = null;
export function doc(): DynamoDBDocument {
  if (!_doc) {
    _doc = DynamoDBDocument.from(
      new DynamoDBClient({ region: AWS_REGION, credentials: awsCredentials() }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }
  return _doc;
}

export const key = {
  user: (sub: string) => ({ PK: `USER#${sub}`, SK: "PROFILE" }),
  wsMeta: (wid: string) => ({ PK: `WS#${wid}`, SK: "META" }),
  member: (wid: string, uid: string) => ({ PK: `WS#${wid}`, SK: `MEMBER#${uid}` }),
  project: (wid: string, pid: string) => ({ PK: `WS#${wid}`, SK: `PROJECT#${pid}` }),
  task: (wid: string, tid: string) => ({ PK: `WS#${wid}`, SK: `TASK#${tid}` }),
  column: (wid: string, cid: string) => ({ PK: `WS#${wid}`, SK: `COLUMN#${cid}` }),
  approval: (wid: string, aid: string) => ({ PK: `WS#${wid}`, SK: `APPROVAL#${aid}` }),
  notification: (wid: string, nid: string) => ({ PK: `WS#${wid}`, SK: `NOTIF#${nid}` }),
  attach: (wid: string, aid: string) => ({ PK: `WS#${wid}`, SK: `ATTACH#${aid}` }),
  document: (wid: string, did: string) => ({ PK: `WS#${wid}`, SK: `DOC#${did}` }),
};

export type Item = Record<string, unknown>;

export async function putItem(item: Item) {
  await doc().put({ TableName: DDB_TABLE, Item: item });
}

export async function getItem(k: Record<string, string>) {
  const r = await doc().get({ TableName: DDB_TABLE, Key: k });
  return r.Item ?? null;
}

export async function deleteItem(k: Record<string, string>) {
  await doc().delete({ TableName: DDB_TABLE, Key: k });
}

/** All items in a workspace (or user) partition. */
export async function queryPartition(pk: string): Promise<Item[]> {
  const out: Item[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const r = await doc().query({
      TableName: DDB_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ExclusiveStartKey,
    });
    out.push(...(r.Items ?? []));
    ExclusiveStartKey = r.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

/** Find items by email via the GSI (used to link invited members). */
export async function queryByEmail(email: string): Promise<Item[]> {
  const r = await doc().query({
    TableName: DDB_TABLE,
    IndexName: "byEmail",
    KeyConditionExpression: "GSI1PK = :e",
    ExpressionAttributeValues: { ":e": `EMAIL#${email.toLowerCase()}` },
  });
  return r.Items ?? [];
}

/** Attach the byEmail GSI key to a member-like item. */
export function withEmailIndex<T extends Item>(item: T, email: string): T {
  return { ...item, GSI1PK: `EMAIL#${email.toLowerCase()}`, GSI1SK: item.SK };
}

/** Remove internal single-table keys before returning an item to the client. */
export function stripKeys(item: Item): Item {
  const rest = { ...item };
  delete rest.PK;
  delete rest.SK;
  delete rest.GSI1PK;
  delete rest.GSI1SK;
  delete rest.type;
  return rest;
}
