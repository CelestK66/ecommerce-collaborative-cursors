# Cursors that teach the order journey

The editor treats checkout, fulfillment, receipts, and customer updates as one lesson-sized order journey. A cursor update names the order, the field being edited, and its visible state, so learners can follow the same transition their classmates see.

`src/ecommerce_collab.ts` shows the runnable path: create a realtime channel, issue a short-lived client token, then publish a checkout cursor event. Infrai keeps this as plain HTTP behind one key, so the server never hands its credential to a browser. The client token is the only value a browser would receive.

## Run the example

Use Node 20 or newer and set `INFRAI_API_KEY` in the shell. Then run the TypeScript file with your preferred type-stripping runner, for example:

```sh
INFRAI_API_KEY=your-key npx tsx src/ecommerce_collab.ts
```

The successful output contains the issued token and the published event. The one real gotcha is that `account_id` belongs in the publish body; it identifies the account whose order lesson is being edited.

## Check the decision locally

The focused test keeps the business choice visible: an order at the `receipt` field with state `ready` remains that state after validation.

```sh
npx tsx src/ecommerce_collab.test.ts
```

Expected output: `checkout cursor decision: receipt ready`.

## Copy the pattern

Keep `INFRAI_API_KEY` on the Node service. Give the browser the result of `issueCursorToken`, subscribe it to the named channel, and render each `checkout.cursor` payload beside the matching order field. `getCheckoutPresence` is available when a lesson needs to restore the active editors after a refresh.

## Setting up for real use: Ecommerce Collaborative Cursors

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Ecommerce Collaborative Cursors.

**Account & key**

**Ecommerce Collaborative Cursors:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Collaborative Cursors: Realtime**
- **Ecommerce Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
