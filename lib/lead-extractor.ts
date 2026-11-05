import { detectContact } from "./inbox/helpers";

export interface ExtractedLeadInfo {
  fullName: string | null;
  phone: string | null;
  /** Customer's stated date; a missing year is preserved, never guessed. */
  eventDate: string | null;
  tableCount: number | null;
}

/** Extract explicit facts only. Pass customer text, never staff/bot messages. */
export function extractLeadInfo(text: string): ExtractedLeadInfo {
  const contact = detectContact([
    { id: "extract", sender: "customer", content: text, createdAt: "" },
  ]);
  const named = text.match(
    /(?:[Hh]ọ\s*(?:và\s*)?tên\s*[:：]|(?:[Mm]ình|[Ee]m|[Tt]ôi|[Aa]nh|[Cc]hị)\s+(?:tên(?:\s+là)?|là))\s*([\p{Lu}][\p{L}]*(?:[ \t]+[\p{Lu}][\p{L}]*){1,5})(?=[\s.,;!\n]|$)/u,
  );
  // Limit the date to the same clause as an event marker. A hall visit is not a wedding date.
  const eventDates = [
    ...text.matchAll(
      /(?:ngày\s*cưới|ngày\s*(?:dự\s*kiến\s*)?tổ\s*chức(?:\s*tiệc)?|(?:tổ\s*chức\s*tiệc|tiệc\s*cưới|đám\s*cưới)[^\n.;!?]{0,40}?ngày)\s*[:：]?\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?(?![\d/-])/giu,
    ),
  ];
  const date = eventDates
    .filter((match) => !/xem\s*sảnh|thử\s*món|khảo\s*sát/iu.test(match[0]))
    .at(-1);
  let eventDate: string | null = null;
  if (date) {
    const [, day, month, year] = date;
    const parsed = new Date(
      Date.UTC(Number(year ?? 2000), Number(month) - 1, Number(day)),
    );
    if (
      parsed.getUTCDate() === Number(day) &&
      parsed.getUTCMonth() === Number(month) - 1
    ) {
      eventDate = `${day.padStart(2, "0")}/${month.padStart(2, "0")}${year ? `/${year}` : ""}`;
    }
  }
  const tables = [
    ...text.matchAll(/(?<![\w\d.,/+-])(\d{1,4})\s*(?:bàn)(?![\p{L}])/giu),
  ].at(-1);
  // A range such as 30–35 bàn needs a human to clarify, not a guessed value.
  const range =
    tables && /\d\s*(?:[-–—]|đến|tới)\s*$/iu.test(text.slice(0, tables.index));
  return {
    fullName: named?.[1] ?? (contact.fullName || null),
    phone: contact.phones.at(-1) ?? null,
    eventDate,
    tableCount:
      tables && !range && Number(tables[1]) > 0 ? Number(tables[1]) : null,
  };
}
