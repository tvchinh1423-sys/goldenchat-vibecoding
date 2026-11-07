import { expect, test } from "@playwright/test";

test.describe("Notification System, Bell Dropdown, Sound Effects & App Badge", () => {
  test("displays web notification bell, unread count badge, notification center dropdown and sound toggles", async ({
    page,
  }) => {
    // 1. Vào trang inbox hoặc dashboard
    await page.goto("/inbox");

    // 2. Kiểm tra App Badge trên Document Title
    await expect(page).toHaveTitle(/^\(\d+\)\s*OmniChat AI/);

    // 3. Kiểm tra Chuông thông báo trên Header của Web Dashboard
    const bellBtn = page.getByRole("button", { name: /Thông báo/i });
    await expect(bellBtn).toBeVisible();

    // Chuông hiển thị badge số lượng thông báo chưa đọc (ví dụ: 3)
    const badge = bellBtn.locator("span.bg-rose-500").first();
    await expect(badge).toBeVisible();
    const countText = await badge.innerText();
    expect(Number(countText)).toBeGreaterThan(0);

    // 4. Nhấp vào chuông để mở Dropdown Trung tâm Thông báo
    await bellBtn.click();
    await expect(page.getByText("Thông báo").first()).toBeVisible();

    // 5. Kiểm tra các nút công cụ trong Dropdown: Nghe thử âm thanh & Bật/Tắt chuông
    const testSoundBtn = page.getByTitle("Nghe thử âm chuông thông báo");
    await expect(testSoundBtn).toBeVisible();
    await testSoundBtn.click(); // Phát âm thanh thử nghiệm

    const muteBtn = page.getByTitle(/Tắt âm thanh chuông|Bật âm thanh chuông/);
    await expect(muteBtn).toBeVisible();
    await muteBtn.click(); // Đổi sang tắt âm

    // 6. Kiểm tra các mục thông báo mẫu (Tin nhắn mới, Lịch hẹn mới, Cảnh báo SLA)
    await expect(page.getByText(/Tin nhắn mới từ Dũ Chanh/i)).toBeVisible();
    await expect(page.getByText(/Lịch hẹn mới: Vũ Huyền Trang/i)).toBeVisible();
    await expect(page.getByText(/Cảnh báo SLA/i)).toBeVisible();

    // 7. Nhấp "Đánh dấu tất cả là đã đọc"
    const markAllReadBtn = page.getByTitle("Đánh dấu tất cả là đã đọc");
    if (await markAllReadBtn.isVisible()) {
      await markAllReadBtn.click();
      // Badge số lượng trên chuông tự biến mất
      await expect(badge).not.toBeVisible();
      // Document title được khôi phục không còn tiền tố số đếm
      await expect(page).toHaveTitle(/^OmniChat AI/);
    }

    // 8. Bấm vào một thông báo điều hướng tới hội thoại
    await page.getByText(/Tin nhắn mới từ Dũ Chanh/i).click();
    await expect(page.getByRole("heading", { name: "Dũ Chanh", exact: true })).toBeVisible();
  });
});
