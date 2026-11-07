import { expect, test } from "@playwright/test";

test.describe("Notification System, Bell Dropdown, Sound Effects & App Badge", () => {
  test("displays web notification bell, unread count badge, notification center dropdown and sound toggles", async ({
    page,
  }) => {
    // 0. Bơm thông báo kiểm thử và phiên Admin vào storage
    await page.addInitScript(() => {
      window.sessionStorage.setItem("omnichat_user_id", "usr_admin");
      window.sessionStorage.setItem("omnichat_staff_auth", "true");
      window.sessionStorage.setItem("omnichat_staff_name", "Ban Giám Đốc");
      window.sessionStorage.setItem("omnichat_user_role", "admin");
      window.localStorage.setItem("omnichat.current_user.v1", "usr_admin");
      window.localStorage.setItem("omnichat.production_mode", "true");
      window.localStorage.setItem(
        "omnichat_notifications_v1",
        JSON.stringify([
          {
            id: "notif-prod-1",
            title: "Lịch hẹn mới: Hoàng Thùy Dương",
            body: "Khách đặt lịch xem sảnh & thử món tiệc cưới 35 bàn lúc 09:30 ngày 12/11.",
            url: "/inbox",
            timestamp: Date.now() - 5 * 60 * 1000,
            type: "booking",
            read: false,
          },
        ])
      );
    });

    // 1. Vào trang inbox hoặc dashboard
    await page.goto("/inbox");

    // 2. Kiểm tra App Badge trên Document Title
    await expect(page).toHaveTitle(/^\(\d+\)\s*OmniChat AI/);

    // 3. Kiểm tra Chuông thông báo trên Header của Web Dashboard
    const bellBtn = page.getByRole("button", { name: /Thông báo/i });
    await expect(bellBtn).toBeVisible();

    // Chuông hiển thị badge số lượng thông báo chưa đọc
    const badge = bellBtn.locator("span.bg-rose-500").first();
    await expect(badge).toBeVisible();
    const countText = await badge.innerText();
    expect(Number(countText)).toBeGreaterThan(0);

    // 4. Nhấp vào chuông để mở Dropdown Trung tâm Thông báo
    await bellBtn.click();
    await expect(page.getByText("Thông báo").first()).toBeVisible();

    // 5. Kiểm tra các nút công cụ trong Dropdown: Nghe thử âm thanh & Bật/Tắt chuông
    const testSoundBtn = page.getByTitle(/Nghe thử âm chuông thông báo/i);
    await expect(testSoundBtn).toBeVisible();
    await testSoundBtn.click(); // Phát âm thanh thử nghiệm Ding-Dong

    // Kiểm tra nút Nghe thử âm chuông chúc mừng đặt lịch tiệc cưới 🎉
    const testCelebrationBtn = page.getByTitle(/chúc mừng đặt lịch thành công/i);
    await expect(testCelebrationBtn).toBeVisible();
    await testCelebrationBtn.click(); // Phát âm thanh thử nghiệm Fanfare & Chime

    const muteBtn = page.getByTitle(/Tắt âm thanh chuông|Bật âm thanh chuông/);
    await expect(muteBtn).toBeVisible();
    await muteBtn.click(); // Đổi sang tắt âm

    // 6. Kiểm tra mục thông báo thực tế (Lịch hẹn mới: Hoàng Thùy Dương)
    await expect(page.getByText(/Lịch hẹn mới: Hoàng Thùy Dương/i)).toBeVisible();

    // 7. Nhấp "Đánh dấu tất cả là đã đọc"
    const markAllReadBtn = page.getByTitle("Đánh dấu tất cả là đã đọc");
    if (await markAllReadBtn.isVisible()) {
      await markAllReadBtn.click();
      // Badge số lượng trên chuông tự biến mất
      await expect(badge).not.toBeVisible();
      // Document title được khôi phục không còn tiền tố số đếm
      await expect(page).toHaveTitle(/^OmniChat AI/);
    }
  });
});
