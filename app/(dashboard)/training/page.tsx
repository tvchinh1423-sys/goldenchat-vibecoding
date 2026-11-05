"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Save,
  Sparkles,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldAlert,
  Radio,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  History,
  Building2,
  CalendarCheck,
  Phone,
  MapPin,
  Pencil,
  X,
  Link2,
} from "lucide-react";
import { KnowledgeUploadModal } from "@/components/training/KnowledgeUploadModal";
import { FormattedMessage } from "@/components/chat/formatted-message";
import {
  DEFAULT_BOT_CONFIG,
  DEFAULT_KNOWLEDGE_BASE,
  BotTrainingConfig,
  INDUSTRY_PRESETS,
  IndustryPreset,
} from "@/lib/mock-service";
import { KnowledgeItem } from "@/types/database";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  guardrailWarning?: string;
  leadExtracted?: any;
  appointmentIntent?: boolean;
}

export default function TrainingPage() {
  // Cấu hình Bot & Ngành nghề
  const [config, setConfig] = useState<BotTrainingConfig>(DEFAULT_BOT_CONFIG);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>(DEFAULT_KNOWLEDGE_BASE);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("wedding_event");
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Accordion toggle states
  const [openSection0, setOpenSection0] = useState(true); // Thông tin doanh nghiệp
  const [openSection1, setOpenSection1] = useState(true); // Persona & Giờ trực
  const [openSection2, setOpenSection2] = useState(false); // Tri thức FAQ
  const [openSection3, setOpenSection3] = useState(false); // Guardrails
  const [openSection4, setOpenSection4] = useState(false); // Bật bot trên kênh

  // Simulator states
  const [selectedChannel, setSelectedChannel] = useState<"zalo" | "facebook" | "web">("zalo");
  const [isWorkingHours, setIsWorkingHours] = useState(true);
  const [simInput, setSimInput] = useState("");
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Dạ em là trợ lý tư vấn tại Trung tâm Tiệc cưới & Sự kiện Golden Palace! Em có thể hỗ trợ thông tin gì về thực đơn bàn tiệc, công suất sảnh cưới hay ưu đãi cho ngày vui của Quý khách ạ?",
      time: "08:30",
    },
  ]);
  const [simLoading, setSimLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Upload Excel Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Form states
  const [newGuardrailText, setNewGuardrailText] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [showAddFaqForm, setShowAddFaqForm] = useState(false);

  // Edit FAQ states
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Google Sheets sync state
  const [showGSheetForm, setShowGSheetForm] = useState(false);
  const [gSheetUrl, setGSheetUrl] = useState("");
  const [gSheetLoading, setGSheetLoading] = useState(false);
  const [gSheetError, setGSheetError] = useState<string | null>(null);

  // Scroll to bottom simulator
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [simMessages, simLoading]);

  // Áp dụng Preset Ngành nghề (Multi-Industry Switcher)
  const handleSelectPreset = (presetKey: string) => {
    const preset = INDUSTRY_PRESETS[presetKey];
    if (!preset) return;

    setSelectedPresetKey(presetKey);
    setConfig((prev) => ({
      ...prev,
      businessProfile: preset.profile,
      persona: preset.persona,
      guardrails: preset.guardrails,
      sampleTestPrompts: preset.samplePrompts,
    }));
    setKnowledgeList(preset.knowledgeBase);
    setShowPresetDropdown(false);

    // Cập nhật câu chào trong Simulator
    setSimMessages([
      {
        id: `wel-${Date.now()}`,
        sender: "bot",
        text: `Dạ em là trợ lý tư vấn tại ${preset.profile.name}! Quý khách đang quan tâm đến ${preset.profile.serviceTypeName} hay cần tư vấn báo giá và ${preset.profile.bookingVerb} ạ?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Thêm chip gợi ý vào Persona
  const handleAddPromptChip = (chipText: string) => {
    setConfig((prev) => ({
      ...prev,
      persona: prev.persona ? `${prev.persona}\n${chipText}` : chipText,
    }));
  };

  // Lưu cấu hình
  const handleSaveConfig = async () => {
    try {
      await fetch("/api/training/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      alert("Lỗi khi lưu cấu hình!");
    }
  };

  // Gửi tin nhắn trong Simulator
  const handleSendSimulatorMessage = async (customText?: string) => {
    const textToSend = customText || simInput;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSimMessages((prev) => [...prev, userMsg]);
    if (!customText) setSimInput("");
    setSimLoading(true);

    try {
      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          channel: selectedChannel,
          isWorkingHours,
          persona: config.persona,
          outOfHoursMessage: config.outOfHoursMessage,
          guardrails: config.guardrails,
          knowledgeBase: knowledgeList,
          businessProfile: config.businessProfile,
          messageCount: simMessages.length,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "Dạ em đã nhận được thông tin!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        guardrailWarning: data.guardrailWarning,
        leadExtracted: data.leadExtracted,
        appointmentIntent: data.appointmentIntent,
      };

      setSimMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setSimMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "Dạ hệ thống đang xử lý, Quý khách đợi em một chút nhé!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  // Thêm FAQ thủ công
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newItem: KnowledgeItem = {
      id: `manual-${Date.now()}`,
      category: "thuc_don",
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
      is_active: true,
      tags: ["thủ_công"],
    };
    setKnowledgeList((prev) => [newItem, ...prev]);
    setNewFaqQ("");
    setNewFaqA("");
    setShowAddFaqForm(false);
  };

  // Bắt đầu chỉnh sửa câu hỏi FAQ
  const handleStartEditFaq = (item: KnowledgeItem) => {
    setEditingFaqId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
    setEditCategory(item.category || "thuc_don");
  };

  // Lưu nội dung chỉnh sửa câu hỏi FAQ
  const handleSaveEditFaq = () => {
    if (!editingFaqId || !editQuestion.trim() || !editAnswer.trim()) return;
    setKnowledgeList((prev) =>
      prev.map((item) =>
        item.id === editingFaqId
          ? {
              ...item,
              question: editQuestion.trim(),
              answer: editAnswer.trim(),
              category: editCategory.trim() || item.category,
            }
          : item
      )
    );
    setEditingFaqId(null);
  };

  // Hủy bỏ chỉnh sửa câu hỏi FAQ
  const handleCancelEditFaq = () => {
    setEditingFaqId(null);
  };

  // Đồng bộ câu hỏi FAQ từ Google Sheets
  const handleSyncGoogleSheets = async () => {
    if (!gSheetUrl.trim()) return;
    setGSheetLoading(true);
    setGSheetError(null);
    try {
      const res = await fetch("/api/training/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: gSheetUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Đồng bộ Google Sheet thất bại");
      }
      setKnowledgeList((prev) => [...data.items, ...prev]);
      setShowGSheetForm(false);
      setGSheetUrl("");
      alert(`Đã nạp thành công ${data.count} câu hỏi FAQ từ Google Sheet!`);
    } catch (err: any) {
      setGSheetError(err.message || "Lỗi đồng bộ");
    } finally {
      setGSheetLoading(false);
    }
  };

  // Thêm Guardrail mới
  const handleAddGuardrail = () => {
    if (!newGuardrailText.trim()) return;
    setConfig((prev) => ({
      ...prev,
      guardrails: [...prev.guardrails, newGuardrailText.trim()],
    }));
    setNewGuardrailText("");
  };

  // Xóa Guardrail
  const handleRemoveGuardrail = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      guardrails: prev.guardrails.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header Trang & Selector Ngành Nghề SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bot tư vấn khách
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              SaaS Multi-Industry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình tính cách, tri thức FAQ và bộ nguyên tắc an toàn cho Chatbot đa kênh (Facebook & Zalo qua Botcake)
          </p>
        </div>

        {/* Action Buttons: Đổi ngành nghề & Lịch sử */}
        <div className="flex items-center gap-2">
          {/* Preset Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetDropdown(!showPresetDropdown)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Mẫu: {INDUSTRY_PRESETS[selectedPresetKey]?.name?.split(" (")[0] || "Chọn mẫu"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
            </button>

            {showPresetDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Chọn mẫu ngành nghề thiết lập sẵn
                </div>
                <div className="space-y-1">
                  {Object.values(INDUSTRY_PRESETS).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-2 text-xs ${
                        selectedPresetKey === preset.id
                          ? "bg-blue-50 text-blue-900 border border-blue-200"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {preset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {preset.profile.name}
                        </div>
                      </div>
                      {selectedPresetKey === preset.id && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => alert("Lịch sử phiên bản: v1.1.0 - Golden Palace Showcase đã cập nhật.")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            Lịch sử
          </button>
        </div>
      </div>

      {/* 2. Banner Master Switch (Công tắc tổng) Khớp 100% Ảnh 2 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-900 text-sm">
            Bot tư vấn khách
          </span>
          <button
            type="button"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                isMasterEnabled: !prev.isMasterEnabled,
                masterStatusNote: !prev.isMasterEnabled
                  ? "Bật bởi Chinh lúc " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Tắt bởi quản lý lúc " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.isMasterEnabled ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                config.isMasterEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-xs text-slate-500">
            {config.masterStatusNote}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Công tắc tổng của bot trả lời <span className="font-semibold text-slate-800">khách</span> trên mọi kênh, mọi hội thoại. Tắt ở đây thì bot im ngay, bỏ cả câu trả lời đang chờ gửi; chỉ quản lý hoặc admin bật lại được. Bật rồi thì mỗi kênh vẫn theo chế độ AI riêng của nó (Tắt / Nháp cho sale) — <span className="text-blue-600 font-medium">đặt ở Kênh chat</span>.
        </p>
        <p className="text-[11px] text-slate-400">
          Không ảnh hưởng AI cho nhân viên (Ghi nhanh, Soạn tin, Hỏi nhanh, tóm tắt, phân tích) — cái đó có công tác riêng ở màn AI cho nhân viên.
        </p>
      </div>

      {/* 3. Banner thông báo xanh lá cây */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            Bot sẵn sàng phục vụ — {config.businessProfile.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700">
            Facebook Page: Botcake
          </span>
          <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700">
            Zalo cá nhân: Botcake
          </span>
          <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700">
            Web Widget
          </span>
        </div>
      </div>

      {/* 4. Hai Cột Chính: Cấu Hình (Trái) & Simulator (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== CỘT TRÁI (7 CỘT): CẤU HÌNH BOT ===================== */}
        <div className="lg:col-span-7 space-y-4">
          {/* SECTION 0: THÔNG TIN DOANH NGHIỆP / CƠ SỞ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setOpenSection0(!openSection0)}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Thông tin đơn vị: {config.businessProfile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenSection0(!openSection0)}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                {openSection0 ? "Thu gọn" : "Chỉnh sửa"}
              </button>
            </div>

            {openSection0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 text-[11px]">Tên đơn vị / Thương hiệu</label>
                  <input
                    type="text"
                    value={config.businessProfile.name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        businessProfile: { ...prev.businessProfile, name: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 text-[11px]">Lĩnh vực hoạt động</label>
                  <input
                    type="text"
                    value={config.businessProfile.industry}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        businessProfile: { ...prev.businessProfile, industry: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 text-[11px]">Hotline tư vấn</label>
                  <input
                    type="text"
                    value={config.businessProfile.hotline}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        businessProfile: { ...prev.businessProfile, hotline: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 text-[11px]">Địa chỉ cơ sở</label>
                  <input
                    type="text"
                    value={config.businessProfile.address}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        businessProfile: { ...prev.businessProfile, address: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: BOT NÓI THẾ NÀO */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition">
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setOpenSection1(!openSection1)}
              >
                <span className="font-bold text-slate-900 text-sm">
                  1 · Bot nói thế nào
                </span>
                {openSection1 ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSelectPreset("wedding_event")}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Dùng mẫu Golden Palace
              </button>
            </div>

            {openSection1 && (
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>
                      Ngữ cảnh cho bot ({config.persona.length}/2000) — tên bot, xưng hô, câu chào, phong cách tư vấn
                    </span>
                  </div>

                  {/* Chips gợi ý chèn nhanh */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddPromptChip("+ Khách đã rõ thực đơn và quy mô thì mời ghé xem sảnh & thử món.")}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition"
                    >
                      + Khách rõ thực đơn ➔ Mời xem sảnh & thử món.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPromptChip("+ Khách còn phân vân ngày đẹp ➔ Mời gặp Quản lý tiệc tư vấn 1-1.")}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition"
                    >
                      + Khách phân vân ngày đẹp ➔ Mời tư vấn 1-1.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddPromptChip("+ Khách muốn giữ chỗ ➔ Hướng dẫn thủ tục đặt cọc hợp đồng.")}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition"
                    >
                      + Khách muốn giữ chỗ ➔ Hướng dẫn đặt cọc.
                    </button>
                  </div>

                  {/* Khung Textarea Persona */}
                  <textarea
                    rows={6}
                    value={config.persona}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, persona: e.target.value }))
                    }
                    placeholder="Tên bot: ...&#10;Xưng hô: ...&#10;Phong cách trả lời: ..."
                    className="w-full p-3.5 text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition leading-relaxed resize-y"
                  />
                </div>

                {/* Hàng Giờ Trực & Câu Hẹn Ngoài Giờ */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Trực từ (giờ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.workingHours.start}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          workingHours: {
                            ...prev.workingHours,
                            start: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Đến (giờ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.workingHours.end}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          workingHours: {
                            ...prev.workingHours,
                            end: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Câu hẹn ngoài giờ
                    </label>
                    <input
                      type="text"
                      value={config.outOfHoursMessage}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          outOfHoursMessage: e.target.value,
                        }))
                      }
                      placeholder="Ngoài giờ tư vấn viên sẽ gọi lại..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Nút Lưu cấu hình Section 1 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs text-emerald-600 font-medium">
                    {saveSuccessNotice && "✓ Đã lưu cấu hình Bot thành công!"}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lưu
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: BOT BIẾT GÌ (QUẢN TRỊ TRI THỨC FAQ & UPLOAD EXCEL) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setOpenSection2(!openSection2)}
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">
                  2 · Bot biết gì ({knowledgeList.length} câu hỏi FAQ)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenSection2(!openSection2)}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                {openSection2 ? "Thu gọn" : "Sửa"}
              </button>
            </div>

            {openSection2 && (
              <div className="space-y-4 pt-4 border-t border-slate-100 mt-3">
                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Tải lên file Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGSheetForm(!showGSheetForm)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium transition"
                    >
                      <Link2 className="w-4 h-4 text-blue-600" />
                      Đồng bộ Google Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddFaqForm(!showAddFaqForm)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition"
                    >
                      <Plus className="w-4 h-4 text-slate-500" />
                      Thêm câu hỏi
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Đồng bộ tự động vào Supabase
                  </span>
                </div>

                {/* Form đồng bộ Google Sheet */}
                {showGSheetForm && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in duration-150 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-blue-600" />
                        Đồng bộ tri thức từ Google Sheets:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGSheetForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Dán đường link Google Sheet chứa các cột: <strong>Câu hỏi</strong>, <strong>Câu trả lời</strong>, <strong>Danh mục</strong> (Nhớ mở quyền xem: <em>Bất kỳ ai có liên kết</em>).
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                        value={gSheetUrl}
                        onChange={(e) => setGSheetUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        disabled={!gSheetUrl.trim() || gSheetLoading}
                        onClick={handleSyncGoogleSheets}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition"
                      >
                        {gSheetLoading ? "Đang đồng bộ..." : "Đồng bộ ngay"}
                      </button>
                    </div>

                    {gSheetError && (
                      <div className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                        {gSheetError}
                      </div>
                    )}
                  </div>
                )}

                {/* Form thêm câu hỏi nhanh */}
                {showAddFaqForm && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                    <h4 className="text-xs font-semibold text-slate-800">
                      Thêm mới câu hỏi FAQ:
                    </h4>
                    <input
                      type="text"
                      placeholder="Câu hỏi (ví dụ: Nhà hàng có chỗ đỗ xe ô tô không?)"
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <textarea
                      rows={2}
                      placeholder="Câu trả lời chuẩn của trung tâm..."
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddFaqForm(false)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                      >
                        Thêm vào danh sách
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách FAQ */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {knowledgeList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl text-xs space-y-1.5 border transition ${
                        editingFaqId === item.id
                          ? "bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/10"
                          : "bg-slate-50/70 hover:bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      {editingFaqId === item.id ? (
                        /* Form Chỉnh sửa Inline */
                        <div className="space-y-2.5 pt-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-900 text-xs flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                              Chỉnh sửa nội dung FAQ:
                            </span>
                            <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Câu hỏi của khách:
                            </label>
                            <input
                              type="text"
                              value={editQuestion}
                              onChange={(e) => setEditQuestion(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-0.5">
                              Câu trả lời chuẩn của Bot:
                            </label>
                            <textarea
                              rows={3}
                              value={editAnswer}
                              onChange={(e) => setEditAnswer(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-100">
                            <div className="w-40">
                              <input
                                type="text"
                                placeholder="Danh mục (vd: thuc_don)"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded text-slate-600"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleCancelEditFaq}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                              >
                                <X className="w-3 h-3" />
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditFaq}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Chế độ hiển thị bình thường có nút Sửa và Xóa */
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-slate-800">
                              {item.question}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-medium">
                                {item.category}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditFaq(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition shadow-xs"
                                title="Chỉnh sửa câu hỏi & câu trả lời"
                              >
                                <Pencil className="w-3 h-3 text-blue-600" />
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setKnowledgeList((prev) =>
                                    prev.filter((k) => k.id !== item.id)
                                  )
                                }
                                className="text-slate-300 hover:text-red-500 transition p-1 rounded-md hover:bg-red-50"
                                title="Xóa câu hỏi này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {item.answer}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: BOT KHÔNG ĐƯỢC LÀM GÌ (GUARDRAILS) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setOpenSection3(!openSection3)}
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">
                  3 · Bot không được làm gì ({config.guardrails.length} điều cấm)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenSection3(!openSection3)}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                {openSection3 ? "Thu gọn" : "Sửa"}
              </button>
            </div>

            {openSection3 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 mt-3">
                <p className="text-xs text-slate-500">
                  Bộ quy tắc an toàn (Guardrails) ngăn bot cam kết sai chính sách, hứa hẹn giữ chỗ sai hoặc khiếu nại:
                </p>

                <div className="space-y-2">
                  {config.guardrails.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuardrail(idx)}
                        className="text-amber-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Form thêm điều cấm mới */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nhập điều cấm mới (vd: Không nói xấu đối thủ cạnh tranh...)"
                    value={newGuardrailText}
                    onChange={(e) => setNewGuardrailText(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddGuardrail}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition"
                  >
                    Thêm cấm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: BẬT BOT TRÊN KÊNH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setOpenSection4(!openSection4)}
              >
                <Radio className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm">
                  4 · Bật bot trên kênh (Botcake & Web)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenSection4(!openSection4)}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                {openSection4 ? "Thu gọn" : "Xem"}
              </button>
            </div>

            {openSection4 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 mt-3 text-xs">
                {/* Facebook */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Facebook Page (Botcake Webhook)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Endpoint: <code>/api/webhook/botcake</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium text-[10px]">
                      Tự động trả lời
                    </span>
                  </div>
                </div>

                {/* Zalo cá nhân */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Zalo cá nhân (Botcake)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Kết nối tập trung qua Botcake Webhook
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium text-[10px]">
                      Tự động trả lời
                    </span>
                  </div>
                </div>

                {/* Web Chat Widget */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Web Chat Widget (Nhúng website)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Khung chat nhúng trực tiếp cho khách hàng
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium text-[10px]">
                      Soạn nháp cho Sales
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================== CỘT PHẢI (5 CỘT): KHUNG THỬ BOT (SIMULATOR) ===================== */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[780px] overflow-hidden sticky top-16">
          {/* Header Simulator Khớp Ảnh 2 */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Thử bot</span>
              <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium border border-blue-100">
                {config.businessProfile.name.split(" ")[0]} Mode
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSimMessages([
                  {
                    id: `wel-${Date.now()}`,
                    sender: "bot",
                    text: `Đã làm mới cuộc trò chuyện. Hãy gõ hoặc bấm câu hỏi mẫu bên dưới để thử bot ${config.businessProfile.name} nhé!`,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ])
              }
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xoá lịch sử
            </button>
          </div>

          {/* Controls: Chọn kênh & Chế độ giờ */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
            {/* Pill tabs Kênh */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              {(["zalo", "facebook", "web"] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                    selectedChannel === ch
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {ch === "facebook" ? "Facebook" : ch === "zalo" ? "Zalo" : "Web"}
                </button>
              ))}
            </div>

            {/* Toggle Chế độ Trong giờ / Ngoài giờ */}
            <button
              type="button"
              onClick={() => setIsWorkingHours(!isWorkingHours)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                isWorkingHours
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <Clock className="w-3 h-3" />
              {isWorkingHours ? "Trong giờ" : "Ngoài giờ"}
            </button>
          </div>

          {/* Quick Questions Grid (10 câu hỏi mẫu 1 chạm) */}
          <div className="p-3 bg-slate-50/40 border-b border-slate-100 shrink-0">
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {config.sampleTestPrompts.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendSimulatorMessage(promptText)}
                  className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-full transition shadow-xs text-left"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Stream (Vùng tin nhắn qua lại) */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/20"
          >
            {simMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <FormattedMessage
                    text={msg.text}
                    isUser={msg.sender === "user"}
                  />

                  {/* Cảnh báo Guardrail nếu có */}
                  {msg.guardrailWarning && (
                    <div className="mt-2 pt-1.5 border-t border-red-100 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.guardrailWarning}</span>
                    </div>
                  )}

                  {/* Thông báo phát hiện Lead */}
                  {msg.leadExtracted && (
                    <div className="mt-2 pt-1.5 border-t border-emerald-100 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Đã tự động tạo Lead N1 ({msg.leadExtracted.phone})</span>
                    </div>
                  )}

                  {/* Thông báo khách muốn hẹn lịch */}
                  {msg.appointmentIntent && (
                    <div className="mt-2 pt-1.5 border-t border-blue-100 flex items-center gap-1 text-[10px] text-blue-700 font-medium">
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Ý định hẹn lịch: Xem sảnh & Thử món</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {simLoading && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400 ml-1">Bot đang soạn câu trả lời...</span>
              </div>
            )}
          </div>

          {/* Simulator Footer Input */}
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSimulatorMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Gõ câu hỏi để thử..."
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!simInput.trim() || simLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
              >
                <span>Gửi</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Upload Excel */}
      <KnowledgeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={(newItems) => {
          setKnowledgeList((prev) => [...newItems, ...prev]);
          alert(`Đã nạp thành công ${newItems.length} câu hỏi FAQ từ file Excel!`);
        }}
      />
    </div>
  );
}
