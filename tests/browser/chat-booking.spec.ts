import { expect, test } from "@playwright/test";

test("Inbox chip sends a demo customer question and opens an in-chat visit form", async ({
  page,
}) => {
  await page.goto("/inbox");
  const chat = page.getByRole("log");
  const question = "Tôi muốn đặt lịch xem sảnh cuối tuần.";
  await chat.getByRole("button", { name: question, exact: true }).click();
  await expect(chat.locator("p").filter({ hasText: question })).toBeVisible();
  await chat
    .getByRole("button", { name: "Đặt lịch xem sảnh", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Tạo lịch hẹn" });
  await expect(
    dialog.getByLabel("Thời gian hẹn (giờ Việt Nam)", { exact: true }),
  ).toHaveValue(/T09:00$/);
  await expect(dialog.getByLabel("Số điện thoại", { exact: true })).toHaveValue(
    "0339516196",
  );
  await dialog
    .getByRole("button", { name: "Lưu lịch hẹn", exact: true })
    .click();
  await expect(
    chat.getByText("XÁC NHẬN ĐÃ NHẬN LỊCH HẸN", { exact: false }),
  ).toBeVisible();
  const calendar = chat.getByRole("link", { name: "Thêm vào Google Calendar" });
  await expect(calendar).toHaveAttribute(
    "href",
    /dates=\d{8}T020000Z%2F\d{8}T030000Z/,
  );
});

test("Widget saves the selected visit before offering Calendar and CRM can remove it", async ({
  page,
}) => {
  await page.goto("/widget");
  await page
    .getByRole("button", { name: /Tôi muốn đặt lịch xem sảnh sáng mai/ })
    .click();
  await expect(
    page.getByRole("link", { name: "Thêm vào Google Calendar" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Điền thông tin đặt lịch ngay/ })
    .click();
  await page
    .getByPlaceholder("Ví dụ: Trần Vân Chinh")
    .fill("Khách demo Widget");
  await page.getByPlaceholder("Ví dụ: 0912 345 678").fill("0901234567");
  const time = page.locator('input[type="datetime-local"]');
  await expect(time).toHaveValue(/T09:00$/);
  const date = (await time.inputValue()).split("T")[0];
  await time.fill(date + "T09:15");
  await page
    .getByRole("button", { name: "Xác nhận đặt lịch", exact: true })
    .click();
  await expect(
    page.getByText("Lịch demo đã lưu trên trình duyệt.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Thêm vào Google Calendar" }),
  ).toHaveAttribute("href", /T021500Z%2F\d{8}T031500Z/);
  await page.goto("/leads");
  await page.getByRole("button", { name: "Lịch hẹn", exact: true }).click();
  const booking = page
    .locator("article")
    .filter({ hasText: "Khách demo Widget" });
  await expect(booking).toContainText("09:15");
  page.once("dialog", (dialog) => dialog.dismiss());
  await booking.getByRole("button", { name: "Xóa lịch", exact: true }).click();
  await expect(booking).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await booking.getByRole("button", { name: "Xóa lịch", exact: true }).click();
  await expect(booking).toHaveCount(0);
});
