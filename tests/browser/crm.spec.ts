import { expect, test, type Page } from "@playwright/test";
const date = (offset = 3) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
async function fromInbox(page: Page) {
  await page.goto("/inbox");
  await page
    .getByRole("button", { name: "Tạo khách mới", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đã định danh", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Mở hồ sơ & lịch hẹn trong CRM", exact: true })
    .click();
  await expect(
    page.getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true }),
  ).toBeVisible();
}
test("Golden Palace: Inbox → one CRM profile → visit → N3 → reload, edit and cancel", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fromInbox(page);
  const board = page.getByRole("region", {
    name: "Phễu tư vấn Kanban",
    exact: true,
  });
  await expect(
    board.getByRole("heading", { name: "Vũ Huyền Trang", exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Mở hồ sơ Vũ Huyền Trang", exact: true })
    .click();
  await expect(page.getByLabel("Số điện thoại", { exact: true })).toHaveValue(
    "0339516196",
  );
  await page.getByRole("button", { name: "Tạo lịch hẹn", exact: true }).click();
  await page
    .getByLabel("Thời gian hẹn (giờ Việt Nam)", { exact: true })
    .fill(`${date()}T10:00`);
  await page
    .getByLabel("Ghi chú lịch hẹn", { exact: true })
    .fill("Khách đến xem sảnh Ruby và thử menu.");
  await page.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tạo lịch hẹn", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Giai đoạn", { exact: true })).toHaveValue("N3");
  const customerSchedule = page.getByRole("region", {
    name: "Lịch hẹn của khách",
    exact: true,
  });
  await expect(customerSchedule).toContainText("10:00");
  await expect(customerSchedule).toContainText(
    "Khách đến xem sảnh Ruby và thử menu.",
  );
  await page
    .getByLabel("Ngày tổ chức dự kiến", { exact: true })
    .fill("20/12/2026");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true }),
  ).toHaveValue("N3");
  await page
    .getByRole("button", { name: "Mở hồ sơ Vũ Huyền Trang", exact: true })
    .click();
  await expect(
    page.getByLabel("Ngày tổ chức dự kiến", { exact: true }),
  ).toHaveValue("20/12/2026");
  await page.getByRole("button", { name: "Đổi lịch", exact: true }).click();
  await page
    .getByLabel("Thời gian hẹn (giờ Việt Nam)", { exact: true })
    .fill(`${date(4)}T14:30`);
  await page.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(customerSchedule).toContainText("14:30");
  await customerSchedule.getByRole("combobox").selectOption("confirmed");
  await expect(customerSchedule).toContainText("Đã xác nhận");
  await customerSchedule.getByRole("combobox").selectOption("cancelled");
  await expect(customerSchedule.getByRole("combobox")).toHaveValue("cancelled");
  await page.getByRole("button", { name: "Đóng", exact: true }).first().click();
  await page
    .getByRole("button", { name: "Danh sách & Phễu", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Phân bố phễu", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/crm-list-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("0339516196");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Có lịch hẹn đang mở", { exact: true }).check();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("CRM prevents duplicate customers and overlapping appointments; mobile forms fit", async ({
  page,
}) => {
  await fromInbox(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Thêm khách", exact: true }).click();
  await page.getByLabel("Họ và tên", { exact: true }).fill("Khách kiểm thử B");
  await page
    .getByLabel("Số điện thoại", { exact: true })
    .fill("+84 339 516 196");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("đã gắn");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0987654321");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const name of ["Vũ Huyền Trang", "Khách kiểm thử B"]) {
    await page
      .getByRole("button", { name: `Mở hồ sơ ${name}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Tạo lịch hẹn", exact: true })
      .click();
    await page
      .getByLabel("Thời gian hẹn (giờ Việt Nam)", { exact: true })
      .fill(`${date()}T10:00`);
    await page
      .getByRole("button", { name: "Lưu lịch hẹn", exact: true })
      .click();
    if (name === "Khách kiểm thử B") {
      await expect(page.getByRole("alert")).toContainText("đã có lịch");
      await page.getByLabel("Người tiếp đón", { exact: true }).fill("Chị Hiền");
      await page
        .getByRole("button", { name: "Lưu lịch hẹn", exact: true })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Tạo lịch hẹn", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Đóng", exact: true })
      .first()
      .click();
  }
  await page.getByRole("button", { name: "Lịch hẹn", exact: true }).click();
  await expect(
    page.getByText("Chị Hiền · 2 người · Chờ xác nhận", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/crm-bookings-mobile.png" });
});
test("CRM handles unavailable storage and database failures without fake success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("omnichat.crm.")) throw new DOMException("full");
      return original.call(this, key, value);
    };
  });
  await page.goto("/leads");
  await page
    .getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true })
    .selectOption("N4");
  await expect(
    page.getByRole("alert").filter({ hasText: "Không lưu được" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true }),
  ).toHaveValue("N2");
  await page.route("**/api/crm", (r) =>
    r.fulfill({
      status: 503,
      json: { error: "CRM chưa kết nối được Supabase." },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "chưa kết nối" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Phễu tư vấn Kanban", exact: true }),
  ).toHaveCount(0);
});

test("CRM keeps a damaged browser snapshot intact and does not replace it with seed customers", async ({
  page,
}) => {
  const raw = '{"version":1,"leads":[{"id":"damaged"}],"bookings":[]}';
  await page.addInitScript(
    (value) => localStorage.setItem("omnichat.crm.golden-palace.v1", value),
    raw,
  );
  await page.goto("/leads");
  await expect(
    page.getByRole("alert").filter({ hasText: "không hợp lệ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Phễu tư vấn Kanban", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("omnichat.crm.golden-palace.v1"),
    ),
  ).toBe(raw);
});

test("CRM visit changes appear back in the linked Inbox conversation", async ({
  page,
}) => {
  await fromInbox(page);
  await page
    .getByRole("button", { name: "Mở hồ sơ Vũ Huyền Trang", exact: true })
    .click();
  await page.getByRole("button", { name: "Tạo lịch hẹn", exact: true }).click();
  await page
    .getByLabel("Thời gian hẹn (giờ Việt Nam)", { exact: true })
    .fill(`${date()}T14:00`);
  await page
    .getByLabel("Ghi chú lịch hẹn", { exact: true })
    .fill("Xem sảnh theo lịch CRM");
  await page.getByRole("button", { name: "Lưu lịch hẹn", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tạo lịch hẹn", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Mở hội thoại gốc", exact: true })
    .click();
  await page.getByRole("button", { name: "Xem lịch hẹn", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("14:00");
  await expect(page.getByRole("dialog")).toContainText(
    "Xem sảnh theo lịch CRM",
  );
  await page.goto("/leads");
  await page
    .getByRole("button", { name: "Mở hồ sơ Vũ Huyền Trang", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Lịch hẹn của khách", exact: true })
    .getByRole("combobox")
    .selectOption("cancelled");
  await expect(
    page
      .getByRole("region", { name: "Lịch hẹn của khách", exact: true })
      .getByRole("combobox"),
  ).toHaveValue("cancelled");
  await page
    .getByRole("link", { name: "Mở hội thoại gốc", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Xem lịch hẹn", exact: true }),
  ).toBeDisabled();
});
