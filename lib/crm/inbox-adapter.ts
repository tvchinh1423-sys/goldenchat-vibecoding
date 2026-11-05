import type { Conversation } from "@/lib/inbox/types";
import { isActiveBooking } from "./model";
import type { CRMState } from "./client";

/** CRM owns linked contact/visit details; messages and notes remain Inbox-local. */
export function applyCRMToInbox(
  conversations: Conversation[],
  crm: CRMState,
): Conversation[] {
  return conversations.map((c) => {
    const lead = crm.leads.find((l) => l.inbox_reference === c.id);
    if (!lead) return c;
    const booking = crm.bookings
      .filter((b) => b.lead_id === lead.id && isActiveBooking(b))
      .sort(
        (a, b) =>
          Date.parse(a.appointment_time) - Date.parse(b.appointment_time),
      )[0];
    return {
      ...c,
      crmMode: crm.mode,
      lead: lead.phone
        ? {
            id: lead.id,
            conversation_id: c.id,
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            demand_notes: lead.notes,
            source: c.channel,
            status: "new",
            created_at: lead.created_at,
          }
        : c.lead,
      booking: booking
        ? {
            appointmentTime: booking.appointment_time,
            staff: booking.assigned_staff,
            notes: booking.notes,
          }
        : undefined,
    };
  });
}
