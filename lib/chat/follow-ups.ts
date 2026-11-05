function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

export function visitIntent(text: string) {
  const query = normalize(text);
  if (/\b(khong muon|huy|doi lich|da hen|da dat lich)\b/.test(query))
    return undefined;
  if (/\b(thu mon|nem thu)\b/.test(query)) return "thu_mon" as const;
  if (/\b(dat lich|hen lich|hen xem sanh|xin hen)\b/.test(query))
    return "xem_sanh" as const;
  if (
    /\b(ghe xem sanh|tham quan sanh|muon xem sanh|muon ghe)\b/.test(query) &&
    !/\b(xem anh|hinh anh|video)\b/.test(query)
  )
    return "xem_sanh" as const;
}

export function suggestedQuestions(
  text: string,
  goldenPalace = true,
  preferred: string[] = [],
) {
  const query = normalize(text);
  const booking = visitIntent(text);
  const defaults = goldenPalace
    ? [
        "Thực đơn tiệc cưới bao nhiêu một bàn?",
        "Cho tôi xem hình ảnh các sảnh tiệc.",
        "Tôi muốn đặt lịch xem sảnh.",
      ]
    : [
        "Các gói dịch vụ khác nhau thế nào?",
        "Tôi cần chuẩn bị thông tin gì để được tư vấn?",
        "Làm sao để liên hệ tư vấn viên?",
      ];
  const related = !goldenPalace
    ? defaults
    : booking
      ? [
          "Địa chỉ Golden Palace ở đâu?",
          "Tôi cần chuẩn bị gì khi đến xem sảnh?",
          "Có thể thử món khi đến xem sảnh không?",
        ]
      : /\b(thuc don|menu|gia ban|bao nhieu mot ban|do uong)\b/.test(query)
        ? [
            "Có ưu đãi đồ uống không?",
            "Đặt cọc giữ sảnh bao nhiêu?",
            "Tôi muốn đặt lịch xem sảnh cuối tuần.",
          ]
        : /\b(sanh|suc chua|so ban|khach|mam)\b/.test(query)
          ? [
              "Sảnh có những cách bố trí nào?",
              "Đặt cọc giữ sảnh bao nhiêu?",
              "Tôi muốn đặt lịch xem sảnh.",
            ]
          : /\b(coc|thanh toan|hop dong)\b/.test(query)
            ? [
                "Đặt cọc xong cần chuẩn bị gì?",
                "Có thể tham khảo thực đơn trước không?",
                "Tôi muốn đặt lịch xem sảnh.",
              ]
            : defaults;
  const distinct = new Map<string, string>();
  for (const question of [
    ...preferred,
    ...related,
    ...defaults,
    "Tôi có thể gặp tư vấn viên khi nào?",
  ]) {
    const key = normalize(question)
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (
      key &&
      key !== query.replace(/[^a-z0-9]+/g, " ").trim() &&
      !distinct.has(key)
    )
      distinct.set(key, question);
  }
  return [...distinct.values()].slice(0, 3);
}
