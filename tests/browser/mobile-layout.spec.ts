import { expect, test } from "@playwright/test";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("mobile navigation fits narrow screens and clears device insets", async ({
  page,
  browserName,
}) => {
  const width = browserName === "webkit" ? 390 : 360;
  await page.setViewportSize({ width, height: 844 });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.setProperty("--safe-top", "47px");
      document.documentElement.style.setProperty("--safe-bottom", "34px");
    });
  });
  for (const route of [
    "/dashboard",
    "/inbox",
    "/training",
    "/leads",
    "/settings",
    "/download",
  ]) {
    await page.goto(route);
    const nav = page.getByRole("navigation", {
      name: "Thanh điều hướng di động",
    });
    const links = nav.getByRole("link");
    await expect(links).toHaveCount(5);
    for (const link of await links.all()) {
      const bounds = await link.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844 - 34);
    }
    expect(
      (await page.locator("header").first().boundingBox())!.height,
    ).toBeGreaterThan(47);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }

  await page.goto("/training");
  await page.getByRole("link", { name: "Thử bot", exact: true }).tap();
  await expect(page.locator("#thu-bot")).toBeInViewport({ ratio: 0.7 });
});

test("touch layouts keep booking controls reachable when the viewport shrinks", async ({
  page,
}) => {
  await page.goto("/leads");
  await page.getByRole("button", { name: "Thêm khách", exact: true }).tap();
  const lead = page.getByRole("dialog", { name: "Thêm khách hàng" });
  await expect(lead).toBeVisible();
  await expect(lead.getByLabel("Họ và tên")).toHaveCSS("font-size", "16px");
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperties(viewport, {
      height: { value: 300 },
      offsetTop: { value: 24 },
    });
    viewport.dispatchEvent(new Event("resize"));
  });
  await expect
    .poll(async () => {
      const bounds = await lead.boundingBox();
      return bounds ? bounds.y + bounds.height : Infinity;
    })
    .toBeLessThanOrEqual(324);

  await page.goto("/widget");
  await page.getByTitle("Đặt lịch tư vấn & xem sảnh").tap();
  const phone = page.getByPlaceholder("Ví dụ: 0912 345 678");
  await phone.fill("0901234567");
  await expect(phone).toHaveCSS("font-size", "16px");
  await page.setViewportSize({ width: 390, height: 320 });
  const submit = page.getByRole("button", { name: "Xác nhận đặt lịch" });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport({ ratio: 1 });
});

test("landscape touch widget clears the side insets and can reopen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/widget");
  await page.addStyleTag({
    content: ":root { --safe-left: 47px; --safe-right: 47px; }",
  });
  const composer = page.getByPlaceholder(/^Nhập tin nhắn/);
  await expect(composer).toBeVisible();
  const composerBounds = await composer.boundingBox();
  expect(composerBounds!.x).toBeGreaterThanOrEqual(47);
  expect(composerBounds!.x).toBeLessThan(60);
  const send = await page
    .getByRole("button", { name: "Gửi tin nhắn" })
    .boundingBox();
  expect(send!.x + send!.width).toBeLessThanOrEqual(844 - 47);
  await page.getByTitle("Đóng khung chat").tap();
  const launcher = page.getByRole("button", { name: "Mở khung chat" });
  const bounds = await launcher.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(844 - 47);
  expect(bounds!.y).toBeGreaterThan(280);
  await launcher.tap();
  await expect(composer).toBeVisible();
});
