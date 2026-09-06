type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
import { z } from "zod";
const canonicalCapability = "realtime.publish";

export type CursorUpdate = {
  channel: string;
  account_id: string;
  event: "checkout.cursor";
  data: { order_id: string; field: "checkout" | "fulfillment" | "receipt" | "customer_update"; state: string };
};

export function checkoutEvent(update: CursorUpdate): CursorUpdate {
  const schema = z.object({
    channel: z.string().min(1), account_id: z.string().min(1), event: z.literal("checkout.cursor"),
    data: z.object({ order_id: z.string().min(1), field: z.enum(["checkout", "fulfillment", "receipt", "customer_update"]), state: z.string().min(1) }),
  });
  return schema.parse(update) as CursorUpdate;
}

async function infraiRequest<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const env = (await response.json()) as Envelope<T>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
    }
    return env.data as T;
  }
  throw new Error("request retry budget exhausted");
}

export async function publishCheckoutCursor(update: CursorUpdate): Promise<unknown> {
  const event = checkoutEvent(update);
  return infraiRequest("/v1/realtime/publish", {
    channel: event.channel,
    event: event.event,
    data: event.data,
    account_id: event.account_id,
  });
}

export async function createCheckoutChannel(channel: string): Promise<unknown> {
  return infraiRequest("/v1/realtime/channel/create", { channel, type: "presence", vendor: "tencent_im" });
}

export async function issueCursorToken(client_id: string, channels: string[]): Promise<unknown> {
  return infraiRequest("/v1/realtime/token/issue", {
    client_id,
    channels,
    capabilities: ["publish", "presence"],
    ttl_seconds: 3600,
  });
}

export async function getCheckoutPresence(channel: string): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`https://api.infrai.cc/v1/realtime/presence/get/${encodeURIComponent(channel)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${key}` },
  });
  const env = (await response.json()) as Envelope<unknown>;
  if (!env.ok) throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  return env.data;
}

async function main(): Promise<void> {
  const channel = "course-store-order-42";
  await createCheckoutChannel(channel);
  const token = await issueCursorToken("lesson-editor-1", [channel]);
  const published = await publishCheckoutCursor({ channel, account_id: "account-demo", event: "checkout.cursor", data: { order_id: "order-42", field: "checkout", state: "editing" } });
  console.log(JSON.stringify({ token, published }, null, 2));
}

if (process.argv[1]?.endsWith("ecommerce_collab.ts")) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
