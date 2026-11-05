import { BOOKING_TYPES, type BookingInput } from "./model";

export function getSmartBookingDefault(now = Date.now()) {
  const vietnam = new Date(now + 7 * 60 * 60 * 1000);
  if (vietnam.getUTCHours() >= 9) vietnam.setUTCDate(vietnam.getUTCDate() + 1);
  return vietnam.toISOString().slice(0, 10) + "T09:00";
}

export function googleCalendarUrl(
  booking: Pick<BookingInput, "appointment_time" | "event_type">,
) {
  const start = new Date(booking.appointment_time);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const format = (date: Date) =>
    date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${BOOKING_TYPES[booking.event_type]} - Golden Palace`,
    dates: `${format(start)}/${format(end)}`,
    location:
      "Trung tâm Tiệc cưới & Sự kiện Golden Palace, 98 Đông A, Nam Định",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
