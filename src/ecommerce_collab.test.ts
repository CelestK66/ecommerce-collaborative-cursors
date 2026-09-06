import { checkoutEvent } from "./ecommerce_collab";

const event = checkoutEvent({
  channel: "course-store-order-42",
  account_id: "account-demo",
  event: "checkout.cursor",
  data: { order_id: "order-42", field: "receipt", state: "ready" },
});

if (event.data.field !== "receipt" || event.data.state !== "ready") throw new Error("receipt decision was not preserved");
console.log("checkout cursor decision: receipt ready");
