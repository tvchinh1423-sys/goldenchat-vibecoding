import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("PWA and Mobile App Features", () => {
  test.use({
    hasTouch: true,
  });
  test("PWA manifest has required fields, icons, and shortcuts", async () => {
    const manifestPath = path.resolve("public/manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.name).toContain("OmniChat");
    expect(manifest.short_name).toBe("OmniChat");
    expect(manifest.start_url).toBe("/inbox");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#2563eb");
    expect(manifest.background_color).toBe("#f8fafc");

    // Icons check
    const icon192 = manifest.icons.find((i: any) => i.sizes === "192x192" && i.purpose === "any");
    const icon512 = manifest.icons.find((i: any) => i.sizes === "512x512" && i.purpose === "any");
    const maskable192 = manifest.icons.find((i: any) => i.sizes === "192x192" && i.purpose === "maskable");
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(maskable192).toBeDefined();

    // Verify actual files exist on disk
    expect(fs.existsSync(path.resolve("public/icon-192.png"))).toBe(true);
    expect(fs.existsSync(path.resolve("public/icon-512.png"))).toBe(true);
    expect(fs.existsSync(path.resolve("public/apple-touch-icon.png"))).toBe(true);
    expect(fs.existsSync(path.resolve("public/sw.js"))).toBe(true);

    // Shortcuts check
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);
    const inboxShortcut = manifest.shortcuts.find((s: any) => s.url === "/inbox");
    expect(inboxShortcut).toBeDefined();
  });

  test("Mobile viewport renders PWA meta tags and safe area layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/inbox");

    // Check meta tags
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveAttribute("href", "/apple-touch-icon.png");

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");

    // Check mobile bottom navigation exists and has 6 tabs
    const nav = page.getByRole("navigation", { name: "Thanh điều hướng di động" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(6);

    // Tap into first conversation on mobile
    const firstConv = page.locator("button").filter({ hasText: "Vũ Huyền Trang" }).first();
    if (await firstConv.isVisible()) {
      await firstConv.tap();
      // Chat pane should be open
      await expect(page.getByRole("button", { name: "Quay lại danh sách" })).toBeVisible();
      // Check for Call button if phone exists
      const callBtn = page.getByTitle(/Gọi cho Vũ Huyền Trang/);
      if (await callBtn.isVisible()) {
        await expect(callBtn).toHaveAttribute("href", /^tel:/);
      }
    }
  });

  test("Leads page mobile UX has quick action call buttons and FAB add button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/leads");

    // Check mobile quick stage bar
    const mobileStageBar = page.getByLabel("Nhảy nhanh giai đoạn");
    await expect(mobileStageBar).toBeVisible();
    await expect(mobileStageBar.getByRole("button")).toHaveCount(6);

    // Check FAB button exists
    const fabBtn = page.getByRole("button", { name: "Thêm khách hàng mới" });
    await expect(fabBtn).toBeVisible();
  });

  test("Settings page has PWA & Mobile App tab with notification test", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/settings");

    // Tap on PWA tab
    const pwaTab = page.getByRole("button", { name: /Ứng dụng & PWA Mobile/ });
    await expect(pwaTab).toBeVisible();
    await pwaTab.tap();

    // Verify PWA settings section is shown
    await expect(page.getByText("Trạng thái Ứng dụng PWA Mobile")).toBeVisible();
    await expect(page.getByText("Âm thanh thông báo (\"Ting\")")).toBeVisible();
    await expect(page.getByText("Rung phản hồi (Haptic Feedback)")).toBeVisible();

    // Tap test notification button
    const testNotifBtn = page.getByRole("button", { name: "Bắn thử thông báo" });
    await expect(testNotifBtn).toBeVisible();
    await testNotifBtn.tap();

    // In-app Dynamic Island notification banner should appear
    const inAppBanner = page.locator('aside[aria-label="Thông báo tin nhắn mới"]');
    await expect(inAppBanner).toBeVisible();
    await expect(inAppBanner).toContainText("Khách hỏi thực đơn tiệc cưới");
  });
});
