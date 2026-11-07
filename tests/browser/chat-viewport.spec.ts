import { expect, test, type Locator, type Page } from "@playwright/test";

// Reproduce a keyboard shrinking and shifting only the visual viewport.
async function setVisualViewport(
  page: Page,
  height: number,
  offsetTop: number,
) {
  await page.evaluate(
    ({ height, offsetTop }) => {
      const viewport = window.visualViewport!;
      Object.defineProperties(viewport, {
        height: { configurable: true, value: height },
        offsetTop: { configurable: true, value: offsetTop },
      });
      viewport.dispatchEvent(new Event("resize"));
      viewport.dispatchEvent(new Event("scroll"));
    },
    { height, offsetTop },
  );
}

async function expectAboveKeyboard(control: Locator, visibleBottom: number) {
  await expect(control).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await control.boundingBox();
      return bounds ? bounds.y + bounds.height : Infinity;
    })
    .toBeLessThanOrEqual(visibleBottom);
}

test("mobile chat composers and send buttons remain above the keyboard", async ({
  page,
}) => {
  for (const width of [360, 390, 414]) {
    await page.setViewportSize({ width, height: 800 });

    await page.goto("/inbox");
    await page.getByRole("button", { name: /Dũ Chanh/ }).click();
    const inboxInput = page.getByRole("textbox", { name: "Nội dung tin nhắn" });
    await inboxInput.fill("Tin nhắn từ điện thoại");
    await setVisualViewport(page, 300, 30);
    await expectAboveKeyboard(inboxInput, 330);
    const inboxSend = page.getByRole("button", { name: "Gửi", exact: true });
    await expectAboveKeyboard(inboxSend, 330);
    await expect(
      page.getByRole("navigation", { name: "Thanh điều hướng di động" }),
    ).toBeHidden();
    await inboxSend.click();
    await expect(page.getByRole("log")).toContainText("Tin nhắn từ điện thoại");
    await setVisualViewport(page, 800, 0);
    await expect(
      page.getByRole("navigation", { name: "Thanh điều hướng di động" }),
    ).toBeVisible();

    if (width === 360) {
      // Some mobile containers resize the layout viewport as well.
      await page.goto("/inbox");
      await page.getByRole("button", { name: /Dũ Chanh/ }).click();
      await inboxInput.fill("Bàn phím thu nhỏ bố cục");
      await page.setViewportSize({ width, height: 300 });
      await expectAboveKeyboard(inboxInput, 300);
      await expectAboveKeyboard(inboxSend, 300);
      await page.setViewportSize({ width, height: 800 });
    }

    await page.goto("/widget");
    const widgetInput = page.getByPlaceholder(/^Nhập tin nhắn/);
    await widgetInput.fill("Cho tôi xem thực đơn");
    await setVisualViewport(page, 300, 30);
    await expectAboveKeyboard(widgetInput, 330);
    const widgetSend = page.getByRole("button", { name: "Gửi tin nhắn" });
    await expectAboveKeyboard(widgetSend, 330);
    await widgetSend.click();
    await expect(
      page.getByText("Cho tôi xem thực đơn", { exact: true }),
    ).toBeVisible();
    await setVisualViewport(page, 800, 0);
    await expect
      .poll(async () => (await widgetInput.boundingBox())?.y ?? 0)
      .toBeGreaterThan(700);
  }
});

test("embedded mobile widget follows the host visual viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.route("**/widget-test-host", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<meta name="viewport" content="width=device-width, initial-scale=1"><script defer src="/embed.js"></script>',
    }),
  );
  await page.goto("/widget-test-host");
  await page.getByRole("button", { name: "Mở khung chat" }).click();
  const widget = page.frameLocator('iframe[title="OmniChat AI Assistant"]');
  const input = widget.getByPlaceholder(/^Nhập tin nhắn/);
  await input.fill("Xem sảnh");
  await setVisualViewport(page, 300, 30);
  await expectAboveKeyboard(input, 330);
  await expectAboveKeyboard(
    widget.getByRole("button", { name: "Gửi tin nhắn" }),
    330,
  );
});
