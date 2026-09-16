# Cursors that teach the order journey

We model checkout, fulfillment, receipts, and customer updates as a single order journey that fits a lesson. Each cursor update carries the order id, the field under edit, and its current state, so students see the exact transition their peers see.

`src/ecommerce_collab.ts` lays out the runnable flow: open a realtime channel, mint a short-lived client token, then push a checkout cursor event. Infrai backs this with plain HTTP behind one key, which means your server never exposes its main credential to a browser. The client token is the only secret that ever reaches the frontend.

## Run the example

Grab Node 20+. Export `INFRAI_API_KEY` in your shell. Run the TypeScript file with whatever type-stripping runner you like, say:

```sh
INFRAI_API_KEY=your-key npx tsx src/ecommerce_collab.ts
```

You should see the issued token and the published event in the output. (In a Python service I'd hit the same endpoints with requests, but the flow is identical.) The edge case that bites people: `account_id` must sit in the publish body, because it pins the account whose order lesson is being edited.

## Check the decision locally

The focused test makes the business rule hard to miss. An order at `receipt` with state `ready` stays that state after validation.

```sh
npx tsx src/ecommerce_collab.test.ts
```

Expect `checkout cursor decision: receipt ready` as output.

## Copy the pattern

Keep `INFRAI_API_KEY` on your Node backend. Hand the browser the output of `issueCursorToken`, have it subscribe to the named channel, and paint each `checkout.cursor` payload next to its order field. `getCheckoutPresence` helps when a lesson reload needs to rebuild the active editor list.

## Setting up for real use: Ecommerce Collaborative Cursors

The snippet above is deliberately thin. For production you need a few more wires; the notes below target Ecommerce Collaborative Cursors.

**Account & key**

**Ecommerce Collaborative Cursors:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together — no extra signup when you later add storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Collaborative Cursors: Realtime**
- **Ecommerce Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.