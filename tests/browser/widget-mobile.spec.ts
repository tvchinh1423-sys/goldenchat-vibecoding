import { expect, test } from "@playwright/test";

test.use({
  isMobile: true,
  hasTouch: true,
  viewport: { width: 390, height: 844 },
});

test("mobile Widget keeps the composer and booking form usable with the keyboard", async ({
  page,
  browserName,
}) => {
  const width = browserName === "webkit" ? 390 : 360;
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/widget");
  await page.addStyleTag({
    content: ":root { --safe-top: 47px; --safe-bottom: 34px; }",
  });
  const input = page.getByRole("textbox", { name: "Nội dung tin nhắn" });
  await expect(input).toHaveCSS("font-size", "16px");
  await input.fill("Cho tôi xem thực đơn");
  const send = page.getByRole("button", { name: "Gửi tin nhắn" });
  expect((await send.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(
    (await send.boundingBox())!.y + (await send.boundingBox())!.height,
  ).toBeLessThanOrEqual(810);
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperties(viewport, {
      height: { value: 300 },
      offsetTop: { value: 30 },
    });
    viewport.dispatchEvent(new Event("resize"));
  });
  await expect
    .poll(async () => {
      const bounds = await send.boundingBox();
      return bounds ? bounds.y + bounds.height : Infinity;
    })
    .toBeLessThanOrEqual(330);
  await send.tap();
  await expect(
    page.getByText("Cho tôi xem thực đơn", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await page.getByTitle("Đặt lịch tư vấn & xem sảnh").tap();
  const phone = page.getByPlaceholder("Ví dụ: 0912 345 678");
  await phone.fill("0901234567");
  await expect(phone).toHaveCSS("font-size", "16px");
  await page.setViewportSize({ width, height: 320 });
  const submit = page.getByRole("button", { name: "Xác nhận đặt lịch" });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport({ ratio: 1 });
});

test("landscape Widget keeps the composer and launcher inside the safe area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/widget");
  await page.addStyleTag({
    content: ":root { --safe-left: 47px; --safe-right: 47px; }",
  });
  const input = page.getByRole("textbox", { name: "Nội dung tin nhắn" });
  await expect(input).toBeVisible();
  const bounds = await input.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(47);
  expect(bounds!.x).toBeLessThan(60);
  await page.getByTitle("Đóng khung chat").tap();
  const launcher = page.getByRole("button", { name: "Mở khung chat" });
  const launcherBounds = await launcher.boundingBox();
  expect(launcherBounds!.x + launcherBounds!.width).toBeLessThanOrEqual(797);
  expect(launcherBounds!.y).toBeGreaterThan(280);
  await launcher.tap();
  await expect(input).toBeVisible();
});
