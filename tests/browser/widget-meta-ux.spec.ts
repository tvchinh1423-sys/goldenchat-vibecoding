import { expect, test } from "@playwright/test";

test("Web widget provides rich Zalo/Messenger-like chat experience with reactions, attachments, and image preview", async ({
  page,
}) => {
  await page.goto("/widget");

  // 1. Kiểm tra bong bóng chat chào mừng và nút thả cảm xúc
  const botBubble = page.getByText(/Dạ em là trợ lý tư vấn tại Trung tâm Tiệc cưới & Sự kiện Golden Palace/);
  await expect(botBubble).toBeVisible();

  // 2. Thử nghiệm thả cảm xúc (Reaction) trên tin nhắn bot
  const reactionTrigger = page.getByTitle("Thả cảm xúc").first();
  await reactionTrigger.click({ force: true });

  // Kiểm tra thanh floating reaction bar hiển thị 6 biểu cảm kinh điển
  const loveReactionBtn = page.getByTitle("Yêu thích");
  await expect(loveReactionBtn).toBeVisible();
  await loveReactionBtn.click();

  // Kiểm tra huy hiệu reaction ❤️ xuất hiện trên mép bong bóng chat
  const reactionBadge = page.getByTitle("Bấm để gỡ cảm xúc");
  await expect(reactionBadge).toBeVisible();
  await expect(reactionBadge).toContainText("❤️");

  // 3. Kiểm tra Emoji picker
  const emojiTrigger = page.getByTitle("Chèn biểu tượng cảm xúc");
  await emojiTrigger.click();
  const heartEmoji = page.getByRole("button", { name: "💖" }).or(page.getByRole("button", { name: "🎉" })).first();
  if (await heartEmoji.isVisible()) {
    await heartEmoji.click();
  }

  // 4. Kiểm tra gửi nút Thích 👍 (Facebook Messenger style Like button)
  const input = page.getByRole("textbox", { name: "Nội dung tin nhắn" });
  await input.fill(""); // Đảm bảo rỗng
  const likeBtn = page.getByTitle("Gửi nút thích 👍");
  await expect(likeBtn).toBeVisible();
  await likeBtn.click();

  // Tin nhắn like 👍 xuất hiện trong luồng chat
  await expect(page.getByText("👍").first()).toBeVisible();

  // 5. Kiểm tra đính kèm ảnh qua Input File (Cross-platform Canvas compression)
  const fileInput = page.locator("#widget-image-upload");
  // Tạo buffer ảnh png 1x1 giả lập để upload
  const testPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  await fileInput.setInputFiles({
    name: "anh-sanh-cuoi-test.png",
    mimeType: "image/png",
    buffer: testPngBuffer,
  });

  // Kiểm tra thanh thumbnail preview ảnh xuất hiện phía trên composer
  await expect(page.locator("img[alt='anh-sanh-cuoi-test.png']").or(page.locator("img[alt='anh-sanh-cuoi-test.jpg']"))).toBeVisible();

  // Gửi tin nhắn có ảnh kèm chú thích
  await input.fill("Tư vấn giúp em mẫu này");
  const sendBtn = page.getByRole("button", { name: "Gửi tin nhắn" });
  await sendBtn.click();

  // Kiểm tra ảnh đã được gửi trong luồng chat
  const sentImage = page.getByAltText(/anh-sanh-cuoi-test/).first();
  await expect(sentImage).toBeVisible();

  // 6. Nhấp vào ảnh để kiểm tra Modal Lightbox xem ảnh toàn màn hình
  await sentImage.click({ force: true });

  // Kiểm tra modal lightbox mở ra với các nút chức năng
  const closeLightboxBtn = page.getByTitle("Đóng xem ảnh");
  await expect(closeLightboxBtn).toBeVisible({ timeout: 5000 });
  await expect(page.getByTitle("Phóng to")).toBeVisible();
  await expect(page.getByTitle("Tải ảnh về máy")).toBeVisible();

  // Đóng modal lightbox bằng nút Đóng
  await closeLightboxBtn.click({ force: true });
  await expect(closeLightboxBtn).not.toBeVisible();
});
