"use client";
import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Link2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHANNEL_LABELS,
  detectContact,
  formatDate,
  formatTime,
} from "@/lib/inbox/helpers";
import type { Conversation, Lead } from "@/lib/inbox/types";
import { extractLeadInfo } from "@/lib/lead-extractor";
import { useAuth } from "@/lib/auth/auth-context";

export type LeadFields = Pick<
  Lead,
  "full_name" | "phone" | "email" | "demand_notes"
>;
interface Props {
  conversation: Conversation;
  note: string;
  onNote: (note: string) => void;
  onSaveNote: () => void;
  onCreateLead: (fields: LeadFields) => Promise<boolean>;
  onAssign: (value: Conversation["assignedTo"], staffName?: string) => void;
  notify: (text: string) => void;
}
export function InfoPanel({
  conversation,
  note,
  onNote,
  onSaveNote,
  onCreateLead,
  onAssign,
  notify,
}: Props) {
  const { users, currentUser } = useAuth();
  const [dialog, setDialog] = useState<
    "lead" | "booking" | "assign" | "summary" | null
  >(null);
  const [form, setForm] = useState<LeadFields>({
    full_name: "",
    phone: "",
    email: "",
    demand_notes: "",
  });
  const [error, setError] = useState("");
  const [savingLead, setSavingLead] = useState(false);
  const id = useId();
  const contact = detectContact(conversation.messages);
  const extracted = extractLeadInfo(
    conversation.messages
      .filter((message) => message.sender === "customer")
      .map((message) => message.content)
      .join("\n"),
  );
  const email = conversation.lead?.email || contact.emails[0];
  const phone = conversation.lead?.phone || contact.phones[0];
  const latestCustomerMessage =
    [...conversation.messages]
      .reverse()
      .find((message) => message.sender === "customer")?.content ?? "";
  const openLeadForm = () => {
    setForm({
      full_name: extracted.fullName || conversation.name,
      phone: contact.phones[0] ?? "",
      email: contact.emails[0] ?? "",
      demand_notes: [
        extracted.eventDate && `Ngày tổ chức: ${extracted.eventDate}`,
        extracted.tableCount && `Số bàn dự kiến: ${extracted.tableCount}`,
        latestCustomerMessage,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    setError("");
    setDialog("lead");
  };
  const saveLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = {
      full_name: form.full_name.trim(),
      phone: form.phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0"),
      email: form.email.trim(),
      demand_notes: form.demand_notes.trim(),
    };
    if (!fields.full_name || !/^0[35789]\d{8}$/.test(fields.phone)) {
      setError(
        "Vui lòng nhập họ tên và số di động Việt Nam hợp lệ (10 chữ số).",
      );
      return;
    }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      setError("Email chưa hợp lệ.");
      return;
    }
    setSavingLead(true);
    setError("");
    try {
      if (await onCreateLead(fields)) setDialog(null);
      else setError("Số điện thoại đã gắn với một khách hàng trong hộp thư.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Chưa lưu được khách hàng vào CRM.",
      );
    } finally {
      setSavingLead(false);
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
        <h2 className="text-sm font-semibold">Thông tin</h2>
        <span className="text-[10px] text-muted-foreground">
          Chi tiết khách hàng
        </span>
      </div>
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between rounded-xl border p-3">
          <Button
            variant="outline"
            size="icon"
            title={email ? "Gửi email" : "Chưa có email"}
            aria-label="Gửi email cho khách"
            disabled={!email}
            onClick={() => {
              if (email) window.location.href = `mailto:${email}`;
            }}
          >
            <Mail />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Phân công phụ trách"
            aria-label="Phân công phụ trách"
            onClick={() => setDialog("assign")}
          >
            <Users />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Sao chép liên kết hội thoại"
            aria-label="Sao chép liên kết hội thoại"
            onClick={async () => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.set("conversation", conversation.id);
                await navigator.clipboard.writeText(url.toString());
                notify("Đã sao chép liên kết hội thoại trên trình duyệt này.");
              } catch {
                notify("Trình duyệt không cho phép sao chép liên kết.");
              }
            }}
          >
            <Link2 />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title={conversation.booking ? "Xem lịch hẹn" : "Chưa có lịch hẹn"}
            aria-label="Xem lịch hẹn"
            disabled={!conversation.booking}
            onClick={() => setDialog("booking")}
          >
            <CalendarDays />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Xem tóm tắt hội thoại"
            aria-label="Xem tóm tắt hội thoại"
            onClick={() => setDialog("summary")}
          >
            <Sparkles />
          </Button>
        </div>
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Tóm tắt
          </h3>
          <p className="text-xs leading-[1.8] text-muted-foreground">
            Trung tâm Tiệc cưới & Sự kiện Golden Palace · {conversation.unread}{" "}
            tin chưa đọc ·{" "}
            {conversation.status === "archived"
              ? "đã lưu trữ"
              : conversation.status === "resolved"
                ? "hội thoại đã xong"
                : "hội thoại đang mở"}
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded bg-[#f1f3f9] px-2 py-1 text-[9px] text-muted-foreground">
              {CHANNEL_LABELS[conversation.channel]}
            </span>
            <span className="rounded bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-1 text-[9px] font-semibold">
              {conversation.assignedStaffName
                ? `👤 ${conversation.assignedStaffName}`
                : conversation.assignedTo === "me"
                ? "Bạn phụ trách"
                : conversation.assignedTo === "team"
                ? "Đội tư vấn"
                : "Chưa phân công"}
            </span>
          </div>
        </section>
        <section className="rounded-xl border p-4">
          <h3 className="text-[13px] font-semibold">Ghi chú nội bộ</h3>
          <p className="mb-3 mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Khách không thấy.
          </p>
          <label htmlFor={`${id}-note`} className="sr-only">
            Ghi chú cho đội
          </label>
          <Textarea
            id={`${id}-note`}
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="Ghi chú cho đội..."
            maxLength={2000}
            className="min-h-[110px] border-[#f0e3b3] bg-[#fff9e6] text-xs leading-6 focus-visible:ring-amber-300"
          />
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSaveNote}
              disabled={note === conversation.note}
            >
              <Save className="!h-3 !w-3" />
              Lưu ghi chú
            </Button>
          </div>
        </section>
        <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-primary">
            {conversation.lead ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
          </div>
          <h3 className="text-[13px] font-semibold">
            {conversation.lead ? "Đã định danh" : "Chưa định danh"}
          </h3>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">
            {conversation.lead
              ? "Mở CRM để xem hồ sơ và tạo lịch hẹn xem sảnh, thử món."
              : "Tự nhận diện thông tin từ tin nhắn của khách."}
          </p>
          {phone || email ? (
            <div className="my-4 space-y-2.5 text-xs">
              {conversation.lead && (
                <p className="font-medium">{conversation.lead.full_name}</p>
              )}
              {phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <a
                    className="text-primary hover:underline"
                    href={`tel:${phone}`}
                  >
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                  <a
                    className="break-all text-primary hover:underline"
                    href={`mailto:${email}`}
                  >
                    {email}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="my-4 text-xs leading-5 text-muted-foreground">
              Chưa tìm thấy SĐT/email trong tin nhắn. Bạn có thể nhập khi tạo
              khách mới.
            </p>
          )}
          {(extracted.eventDate || extracted.tableCount) && (
            <dl className="mb-4 space-y-2 text-xs text-muted-foreground">
              {extracted.eventDate && (
                <div>
                  <dt>Ngày tổ chức dự kiến</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {extracted.eventDate}
                  </dd>
                </div>
              )}
              {extracted.tableCount && (
                <div>
                  <dt>Số bàn dự kiến</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {extracted.tableCount} bàn
                  </dd>
                </div>
              )}
            </dl>
          )}
          {conversation.lead ? (
            <div className="space-y-3 text-xs font-medium text-emerald-600">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                Đã lưu khách hàng
              </div>
              <Link
                className="inline-block text-blue-600 hover:underline"
                href="/leads"
              >
                Mở hồ sơ & lịch hẹn trong CRM
              </Link>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-blue-200 text-xs text-primary"
              onClick={openLeadForm}
            >
              <UserRoundPlus />
              Tạo khách mới
              <ChevronRight className="ml-auto" />
            </Button>
          )}
        </section>
        {conversation.booking && (
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-left"
            onClick={() => setDialog("booking")}
          >
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            <span className="text-xs">
              <span className="block font-medium">Đã có lịch tư vấn</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                {formatTime(conversation.booking.appointmentTime)} ·{" "}
                {formatDate(conversation.booking.appointmentTime)}
              </span>
            </span>
          </button>
        )}
        <p className="px-1 text-center text-[9px] leading-5 text-muted-foreground">
          Tin nhắn, ghi chú lưu cục bộ. Hồ sơ và lịch hẹn theo nguồn dữ liệu
          CRM.
          <Link
            href="/leads"
            className="block text-xs font-medium text-blue-600 hover:underline"
          >
            Mở CRM khách hàng
          </Link>
        </p>
      </div>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !savingLead) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="pr-6 text-lg font-semibold">
            {dialog === "lead"
              ? "Tạo khách mới"
              : dialog === "booking"
                ? "Lịch hẹn tư vấn"
                : dialog === "assign"
                  ? "Phân công phụ trách"
                  : "Tóm tắt hội thoại"}
          </DialogTitle>
          <DialogDescription className="mb-5 mt-2 text-xs leading-5 text-muted-foreground">
            {dialog === "lead"
              ? "Kiểm tra thông tin bóc tách trước khi lưu khách hàng."
              : dialog === "booking"
                ? "Giờ Việt Nam. Lịch tư vấn chưa giữ chỗ sảnh tiệc."
                : dialog === "assign"
                  ? "Chọn người tiếp nhận cuộc hội thoại này."
                  : "Tổng hợp dữ liệu tin nhắn, chưa sử dụng mô hình AI."}
          </DialogDescription>
          {dialog === "lead" && (
            <form onSubmit={saveLead} className="space-y-4">
              {(
                [
                  {
                    key: "full_name",
                    label: "Họ và tên",
                    type: "text",
                    required: true,
                  },
                  {
                    key: "phone",
                    label: "Số điện thoại",
                    type: "tel",
                    required: true,
                  },
                  {
                    key: "email",
                    label: "Email",
                    type: "email",
                    required: false,
                  },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`${id}-${field.key}`}
                    className="mb-1.5 block text-xs font-medium"
                  >
                    {field.label}
                    {field.required && " *"}
                  </label>
                  <Input
                    id={`${id}-${field.key}`}
                    type={field.type}
                    required={field.required}
                    maxLength={100}
                    value={form[field.key]}
                    onChange={(event) =>
                      setForm({ ...form, [field.key]: event.target.value })
                    }
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor={`${id}-demand`}
                  className="mb-1.5 block text-xs font-medium"
                >
                  Nhu cầu tư vấn
                </label>
                <Textarea
                  id={`${id}-demand`}
                  maxLength={2000}
                  value={form.demand_notes}
                  onChange={(event) =>
                    setForm({ ...form, demand_notes: event.target.value })
                  }
                />
              </div>
              {error && (
                <p role="alert" className="text-xs text-rose-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={savingLead}
                  onClick={() => setDialog(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={savingLead}>
                  <UserRoundPlus />
                  {savingLead ? "Đang lưu..." : "Lưu khách hàng"}
                </Button>
              </div>
            </form>
          )}
          {dialog === "booking" && conversation.booking && (
            <div className="space-y-3 rounded-xl bg-muted p-4 text-sm">
              <p className="font-semibold">{conversation.name}</p>
              <p>
                {formatTime(conversation.booking.appointmentTime)} ·{" "}
                {formatDate(conversation.booking.appointmentTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                {conversation.booking.staff}
              </p>
              <p className="text-xs leading-6">{conversation.booking.notes}</p>
            </div>
          )}
          {dialog === "assign" && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 mb-2">
                Chỉ định tư vấn viên phụ trách phiên chat này:
              </p>
              {users
                .filter((u) => u.active)
                .map((staff) => {
                  const isCurrent =
                    conversation.assignedTo === staff.id ||
                    conversation.assignedStaffName === staff.name ||
                    (conversation.assignedTo === "me" &&
                      currentUser?.id === staff.id);
                  return (
                    <button
                      key={staff.id}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-xs text-left transition-colors ${
                        isCurrent
                          ? "bg-blue-50 border-blue-300 font-semibold text-blue-900 ring-2 ring-blue-500/20"
                          : "hover:bg-slate-50 border-slate-200"
                      }`}
                      onClick={() => {
                        onAssign(staff.id, staff.name);
                        setDialog(null);
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center text-white shrink-0 ${
                            staff.role === "admin"
                              ? "bg-purple-600"
                              : staff.role === "manager"
                              ? "bg-blue-600"
                              : "bg-emerald-600"
                          }`}
                        >
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {staff.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {staff.title || staff.role}
                          </p>
                        </div>
                      </div>
                      {isCurrent && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <button
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-xs hover:bg-slate-50"
                  onClick={() => {
                    onAssign("team", "Đội tư vấn Golden Palace");
                    setDialog(null);
                  }}
                >
                  <span>👥 Đội tư vấn Golden Palace</span>
                  {conversation.assignedTo === "team" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
                <button
                  className="flex w-full items-center justify-between rounded-xl border p-3 text-xs hover:bg-rose-50 text-rose-600 border-rose-100"
                  onClick={() => {
                    onAssign("unassigned", "");
                    setDialog(null);
                  }}
                >
                  <span>⚠️ Bỏ phân công</span>
                  {conversation.assignedTo === "unassigned" && (
                    <Check className="h-4 w-4 text-rose-600" />
                  )}
                </button>
              </div>
            </div>
          )}
          {dialog === "summary" && (
            <div className="space-y-3 text-sm leading-6">
              <p>
                <strong>Khách:</strong>{" "}
                {conversation.lead?.full_name ||
                  contact.fullName ||
                  conversation.name}
              </p>
              <p>
                <strong>Tin nhắn:</strong> {conversation.messages.length} tin ·{" "}
                {
                  conversation.messages.filter(
                    (message) => message.sender === "customer",
                  ).length
                }{" "}
                từ khách
              </p>
              <p>
                <strong>Nội dung gần nhất:</strong> {latestCustomerMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                {phone || email
                  ? "Đã nhận diện được thông tin liên hệ."
                  : "Cần bổ sung thông tin liên hệ để tiếp tục tư vấn."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
