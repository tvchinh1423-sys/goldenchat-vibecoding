import { expect, test } from "@playwright/test";

test("desktop: draft, send, notes, lead validation and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/inbox");
  await expect(
    page.getByRole("heading", { name: "Dũ Chanh", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/inbox-desktop.png" });

  await page.getByRole("button", { name: "Soạn nháp AI", exact: true }).click();
  const composer = page.getByRole("textbox", {
    name: "Nội dung tin nhắn",
    exact: true,
  });
  await expect(composer).toHaveValue(/10.000.000đ/);
  await expect(page.getByRole("log")).not.toContainText(
    "Khoản cọc này được cấn trừ",
  );
  await page.getByRole("switch").check();
  await composer.fill("Tin nhắn kiểm thử: tư vấn viên đã tiếp nhận.");
  await composer.press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Tin nhắn kiểm thử: tư vấn viên đã tiếp nhận.",
  );
  await expect(page.getByRole("switch")).not.toBeChecked();

  const note = page.getByRole("textbox", {
    name: "Ghi chú cho đội",
    exact: true,
  });
  await note.fill("Khách muốn được gọi sau 18h.");
  await page.getByRole("button", { name: "Lưu ghi chú", exact: true }).click();
  await page
    .getByRole("button", { name: "Tạo khách mới", exact: true })
    .click();
  await expect(page.getByLabel("Họ và tên", { exact: false })).toHaveValue(
    "Vũ Huyền Trang",
  );
  await expect(page.getByLabel("Số điện thoại", { exact: false })).toHaveValue(
    "0339516196",
  );
  await page.getByLabel("Số điện thoại", { exact: false }).fill("123");
  await page
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "số di động Việt Nam hợp lệ",
  );
  await page.getByLabel("Số điện thoại", { exact: false }).fill("0339516196");
  await page
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đã định danh", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(note).toHaveValue("Khách muốn được gọi sau 18h.");
  await expect(page.getByRole("log")).toContainText(
    "Tin nhắn kiểm thử: tư vấn viên đã tiếp nhận.",
  );
  await expect(
    page.getByRole("heading", { name: "Đã định danh", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("switch")).not.toBeChecked();
  expect(errors).toEqual([]);
});

test("desktop: combined filters, empty state, archive and restore", async ({
  page,
}) => {
  await page.goto("/inbox");
  await expect(
    page.getByRole("heading", { name: "Dũ Chanh", exact: true }),
  ).toBeVisible();
  const list = page.getByRole("region", {
    name: "Danh sách hội thoại",
    exact: true,
  });
  await list.getByRole("button", { name: "Có lịch hẹn", exact: true }).click();
  await list.getByRole("button", { name: "Có SĐT/email", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hoàng Tú Anh", exact: true }),
  ).toBeVisible();
  await list.getByRole("button", { name: "Kênh", exact: true }).click();
  await page.getByRole("checkbox", { name: "Zalo", exact: true }).check();
  await expect(list.getByRole("button", { name: /Hoàng Tú Anh/ })).toHaveCount(
    1,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("textbox", { name: "Tìm hội thoại", exact: true })
    .fill("khong co khach nay");
  await expect(
    list.getByText("Không tìm thấy hội thoại", { exact: true }),
  ).toBeVisible();
  await list.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await page
    .getByRole("button", { name: "Lưu trữ hội thoại", exact: true })
    .click();
  await list.getByRole("button", { name: "Lưu trữ", exact: true }).click();
  await list.getByRole("button", { name: /Dũ Chanh/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Nội dung tin nhắn" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Khôi phục hội thoại", exact: true })
    .click();
  await list
    .getByRole("button", { name: "Đang xem lưu trữ", exact: true })
    .click();
  await list.getByRole("button", { name: /Dũ Chanh/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Nội dung tin nhắn" }),
  ).toBeVisible();
});

test("mobile: list, chat, nested lead dialog, notes and back navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inbox");
  await page.getByRole("button", { name: /Dũ Chanh/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Nội dung tin nhắn" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/inbox-mobile.png" });
  await page
    .getByRole("button", { name: "Thông tin khách hàng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Tạo khách mới", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Lưu khách hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đã định danh", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Ghi chú cho đội", exact: true })
    .fill("Ghi chú từ mobile");
  await page.getByRole("button", { name: "Lưu ghi chú", exact: true }).click();
  await page.screenshot({ path: "test-results/inbox-mobile-info.png" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Quay lại danh sách", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Tìm hội thoại", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("layouts fit narrow mobile, tablet and desktop without horizontal overflow", async ({
  page,
}) => {
  for (const width of [360, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/inbox");
    await expect(
      page.getByRole("textbox", { name: "Tìm hội thoại", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
    if (width < 768) {
      await page.getByRole("button", { name: /Dũ Chanh/ }).click();
      const send = page.getByRole("button", { name: "Gửi", exact: true });
      await expect(send).toBeVisible();
      const box = await send.boundingBox();
      expect(box && box.x + box.width <= width).toBeTruthy();
    }
  }
  await page
    .getByRole("link", { name: "Bot tư vấn khách", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bot tư vấn khách", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Kênh chat/ }).click();
  await expect(
    page.getByRole("heading", { name: "Hộp thư", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main > header")).toHaveCount(1);
});
