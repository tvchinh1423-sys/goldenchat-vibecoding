import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDemoConversations,
  createFaqDraft,
  knowledgeBase,
} from "../lib/inbox/demo-data";
import {
  detectContact,
  filterConversations,
  waitingLabel,
} from "../lib/inbox/helpers";
import { parseSnapshot } from "../lib/inbox/storage";
import type { InboxFilters, Message } from "../lib/inbox/types";

const filters: InboxFilters = {
  query: "",
  tab: "all",
  channels: [],
  hasBooking: false,
  hasContact: false,
  showArchived: false,
};
const messages = (
  content: string,
  sender: Message["sender"] = "customer",
): Message[] => [
  { id: "test", sender, content, createdAt: "2026-11-05T09:00:00+07:00" },
];

test("extract contacts only from customer messages, retaining the phone's leading zero", () => {
  const result = detectContact([
    ...messages("Vũ Huyền Trang\n+84 339 516 196\nvhuyntrang231@gmail.com"),
    ...messages("Hotline 0987654321 hoặc staff@kstudy.vn", "agent"),
  ]);
  assert.deepEqual(result.phones, ["0339516196"]);
  assert.deepEqual(result.emails, ["vhuyntrang231@gmail.com"]);
  assert.equal(result.fullName, "Vũ Huyền Trang");
});
test("do not mistake long digit sequences, order IDs or ordinary sentences for contact information", () => {
  const result = detectContact(
    messages("Đơn ABC0912345678; mã 091234567890.\nEm muốn học buổi tối"),
  );
  assert.deepEqual(result.phones, []);
  assert.equal(result.fullName, "");
});
test("combine tab, channel, booking and contact filters", () => {
  const results = filterConversations(createDemoConversations(), {
    ...filters,
    tab: "mine",
    channels: ["zalo"],
    hasBooking: true,
    hasContact: true,
  });
  assert.deepEqual(
    results.map((item) => item.id),
    ["anh"],
  );
});
test("support accent-insensitive names and formatted phone searches", () => {
  assert.equal(
    filterConversations(createDemoConversations(), {
      ...filters,
      query: "nguyen nhat minh",
    })[0]?.id,
    "minh",
  );
  assert.equal(
    filterConversations(createDemoConversations(), {
      ...filters,
      query: "0339 516 196",
    })[0]?.id,
    "trang",
  );
});
test("separate archive from inbox, including when other filters are empty", () => {
  assert.ok(
    filterConversations(createDemoConversations(), filters).every(
      (item) => item.status !== "archived",
    ),
  );
  assert.deepEqual(
    filterConversations(createDemoConversations(), {
      ...filters,
      showArchived: true,
    }).map((item) => item.id),
    ["archived"],
  );
});
test("only customer messages awaiting a response produce an SLA label", () => {
  const item = createDemoConversations()[0];
  assert.equal(
    waitingLabel(item, Date.parse("2026-11-05T15:30:00+07:00")),
    "chờ 2 giờ",
  );
  assert.equal(
    waitingLabel(
      { ...item, messages: messages("Đã nhận thông tin", "agent") },
      Date.now(),
    ),
    null,
  );
  assert.equal(waitingLabel(item, Date.parse("2026-11-01T00:00:00+07:00")), null);
});
test("draft comes from the supplied FAQ and does not mutate or send messages", () => {
  const history = messages("Học phí và trả góp thế nào ạ?");
  const original = JSON.stringify(history);
  const reply = createFaqDraft(history);
  assert.ok(
    reply.includes(
      knowledgeBase.find((faq) => faq.category === "hoc_phi")!.answer,
    ),
  );
  assert.equal(JSON.stringify(history), original);
});
test("round-trip persistence and reject damaged snapshots safely", () => {
  const conversations = createDemoConversations();
  assert.deepEqual(
    parseSnapshot(JSON.stringify({ version: 1, conversations })),
    conversations,
  );
  assert.throws(() =>
    parseSnapshot('{"version":1,"conversations":[{"id":"broken"}]}'),
  );
  assert.throws(() =>
    parseSnapshot(
      JSON.stringify({
        version: 1,
        conversations: [
          {
            ...conversations[0],
            messages: [
              { ...conversations[0].messages[0], createdAt: "invalid" },
            ],
          },
        ],
      }),
    ),
  );
});
