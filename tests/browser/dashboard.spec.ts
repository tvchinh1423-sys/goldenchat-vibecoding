import { expect, test } from "@playwright/test";

test("Báo cáo counts channels and CRM records and labels sample metrics", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route("**/api/crm", (route) =>
    route.fulfill({
      json: {
        mode: "supabase",
        leads: [{ stage: "N1" }, { stage: "N5" }, { stage: "N0" }],
        bookings: [
          { event_type: "xem_sanh", status: "confirmed" },
          { event_type: "xem_sanh", status: "cancelled" },
          { event_type: "thu_mon", status: "pending" },
        ],
      },
    }),
  );
  await page.goto("/inbox");
  const navigation = page.getByRole("navigation", {
    name: "Thanh điều hướng di động",
  });
  await navigation.getByRole("link", { name: "Báo cáo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    navigation.getByRole("link", { name: "Báo cáo" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("heading", { name: "Báo cáo thống kê" }),
  ).toBeVisible();

  const metrics = page.locator("dl > div");
  await expect(metrics.nth(0).locator("dd").first()).toHaveText("8");
  await expect(metrics.nth(1)).toContainText("Số liệu minh họa");
  await expect(metrics.nth(1).locator("dd").first()).toHaveText("82%");
  await expect(metrics.nth(2).locator("dd").first()).toHaveText("2");
  await expect(metrics.nth(3).locator("dd").first()).toHaveText("1");
  const channels = page.getByRole("region", { name: "Hội thoại theo kênh" });
  await expect(
    channels.getByRole("listitem").filter({ hasText: "Zalo cá nhân" }),
  ).toContainText("25%");
  const funnel = page.getByRole("region", {
    name: "Phễu chuyển đổi khách hàng",
  });
  await expect(
    funnel.getByRole("listitem").filter({ hasText: "N4" }),
  ).toContainText("16%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
});
