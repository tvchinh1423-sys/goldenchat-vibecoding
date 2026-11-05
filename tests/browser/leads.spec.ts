import { expect, test } from "@playwright/test";

test("six-stage wedding funnel supports moving, persistence and search", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/leads");
  await expect(
    page.getByRole("heading", {
      name: "Phễu khách hàng / Phễu tư vấn",
      exact: true,
    }),
  ).toBeVisible();
  const board = page.getByRole("region", {
    name: "Phễu tư vấn Kanban",
    exact: true,
  });
  await expect(board.locator("section")).toHaveCount(6);
  await expect(
    board.getByRole("region", { name: "N3 · KHẢO SÁT 1-1", exact: true }),
  ).toContainText("Đã hẹn lịch xem sảnh & thử món");
  await page.screenshot({
    path: "test-results/leads-desktop.png",
    fullPage: true,
  });
  await page
    .getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true })
    .selectOption("N3");
  await expect(
    board.getByRole("region", { name: "N3 · KHẢO SÁT 1-1", exact: true }),
  ).toContainText("Vũ Huyền Trang");
  await page.reload();
  await expect(
    page.getByLabel("Giai đoạn của Vũ Huyền Trang", { exact: true }),
  ).toHaveValue("N3");
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("vu huyen trang");
  await expect(board.locator("article")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Tìm khách hàng", exact: true })
    .fill("Không tồn tại");
  await expect(board.locator("article")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Kanban allows drag and drop, and mobile keeps scrolling inside the board", async ({
  page,
}) => {
  await page.goto("/leads");
  const board = page.getByRole("region", {
    name: "Phễu tư vấn Kanban",
    exact: true,
  });
  const target = board.getByRole("region", {
    name: "N3 · KHẢO SÁT 1-1",
    exact: true,
  });
  const card = board.locator("article").filter({
    has: page.getByRole("heading", { name: "Vũ Huyền Trang", exact: true }),
  });
  // Start at the card heading and drop on the column heading. Center-based
  // dragging can land on the embedded native select after automatic scrolling.
  await card.dragTo(target, {
    sourcePosition: { x: 20, y: 25 },
    targetPosition: { x: 50, y: 40 },
  });
  await expect(target).toContainText("Vũ Huyền Trang");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Phễu khách hàng / Phễu tư vấn",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/leads-mobile.png",
    fullPage: true,
  });
  const choice = page.getByLabel("Giai đoạn của Vũ Huyền Trang", {
    exact: true,
  });
  await choice.selectOption("N4");
  await expect(choice).toHaveValue("N4");
});
