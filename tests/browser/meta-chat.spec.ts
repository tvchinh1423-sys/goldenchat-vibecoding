import { expect, test } from "@playwright/test";

test.describe("Meta Business Suite Chat Experience", () => {
  test("supports Meta reactions, pinned messages banner, lightbox media, and quick like button", async ({
    page,
  }) => {
    // 0. Thiết lập phiên đăng nhập Admin kiểm thử
    await page.addInitScript(() => {
      window.sessionStorage.setItem("omnichat_user_id", "usr_admin");
      window.sessionStorage.setItem("omnichat_staff_auth", "true");
      window.sessionStorage.setItem("omnichat_staff_name", "Ban Giám Đốc");
      window.sessionStorage.setItem("omnichat_user_role", "admin");
      window.localStorage.setItem("omnichat.current_user.v1", "usr_admin");
    });

    // 1. Vào trang inbox
    await page.goto("/inbox");
    await expect(page.getByRole("heading", { name: /Hoàng Thùy Dương/i })).toBeVisible();

    // 2. Kiểm tra Quick Like (nút Thích 👍)
    const quickLikeBtn = page.getByRole("button", { name: "Gửi thích" });
    await expect(quickLikeBtn).toBeVisible();

    // Bấm nút thích nhanh -> tin nhắn 👍 được gửi ngay
    await quickLikeBtn.click();
    await expect(page.getByRole("log")).toContainText("👍");

    // Khi gõ chữ vào composer, nút Gửi được kích hoạt
    const composer = page.getByRole("textbox", { name: "Nội dung tin nhắn", exact: true });
    await composer.fill("Golden Palace xin kính chào Quý khách!");
    const sendBtn = page.getByRole("button", { name: "Gửi", exact: true });
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();
    await expect(page.getByRole("log")).toContainText("Golden Palace xin kính chào Quý khách!");

    // 3. Mở Emoji Picker và kiểm tra các tab phân loại (Cảm xúc, Cử chỉ, Tiệc cưới & F&B)
    const emojiPickerBtn = page.getByRole("button", { name: "Chèn cảm xúc" });
    await emojiPickerBtn.click();
    await expect(page.getByRole("button", { name: "Tiệc cưới & F&B" })).toBeVisible();
    await page.getByRole("button", { name: "Tiệc cưới & F&B" }).click();
    // Chọn emoji 🎂
    await page.getByRole("button", { name: "Chèn 🎂" }).click();
    await expect(composer).toHaveValue("🎂");
    // Xóa composer
    await composer.fill("");

    // 4. Kiểm tra Hover / Thả reaction Meta (❤️, 👍, 😆, 😮, 😢, 😡)
    const reactionTriggerBtn = page.getByRole("button", { name: "Bày tỏ cảm xúc" }).first();
    await reactionTriggerBtn.click();

    // Thanh Floating Reaction Bar xuất hiện chứa các emoji Meta
    const loveBtn = page.getByRole("button", { name: "Yêu thích" });
    await expect(loveBtn).toBeVisible();
    await loveBtn.click();

    // Badge reaction xuất hiện trên tin nhắn
    await expect(page.getByRole("button", { name: "Thả tim" }).first()).toBeVisible();

    // 5. Kiểm tra Ghim tin nhắn (Pin Message) & Thanh Pinned Message Banner
    const pinBtn = page.getByRole("button", { name: "Ghim tin nhắn" }).first();
    await pinBtn.click();

    // Pinned Banner xuất hiện ở đỉnh Chat Pane
    const pinnedBanner = page.getByText("TIN ĐÃ GHIM:");
    await expect(pinnedBanner).toBeVisible();

    // Bấm nút "Xem" trên banner ghim -> tự cuộn đến tin nhắn
    const viewPinnedBtn = page.getByRole("button", { name: "Xem" }).first();
    await expect(viewPinnedBtn).toBeVisible();
    await viewPinnedBtn.click();

    // 6. Kiểm tra Lightbox phóng to ảnh khi nhấp vào media
    // Tìm ảnh trong đoạn chat
    const messageImages = page.locator('img[alt="Đính kèm"], img[alt="Ảnh gửi"]');
    if ((await messageImages.count()) > 0) {
      await messageImages.first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Mở ảnh gốc / Tải về")).toBeVisible();
      await page.getByRole("button", { name: "Đóng" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });
});
