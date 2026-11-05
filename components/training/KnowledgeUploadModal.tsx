"use client";

import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { KnowledgeItem } from "@/types/database";

interface KnowledgeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newItems: KnowledgeItem[]) => void;
}

export function KnowledgeUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: KnowledgeUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<KnowledgeItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/api/training/upload?template=true", "_blank");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn một file Excel (.xlsx) hoặc CSV");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/training/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tải lên thất bại");
      }

      onUploadSuccess(data.items);
      onClose();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đọc file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Nạp tri thức Bot qua Excel
              </h3>
              <p className="text-xs text-slate-500">
                Tự động nhập hàng loạt câu hỏi & câu trả lời FAQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Download Template Banner */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800">
            <span>Chưa có file mẫu đúng chuẩn cột?</span>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 font-medium text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm hover:bg-blue-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file mẫu Excel
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              file
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {file ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <p className="text-sm font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB · Bấm để chọn file khác
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Kéo thả file vào đây hoặc <span className="text-blue-600 underline">chọn file</span>
                </p>
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 10MB)
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">💡 Hướng dẫn cấu trúc file Excel:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>Cột 1: <strong>Danh mục</strong> (ví dụ: Học phí, Lịch học, Học thử...)</li>
              <li>Cột 2: <strong>Câu hỏi</strong> (nội dung câu hỏi của khách hàng)</li>
              <li>Cột 3: <strong>Câu trả lời</strong> (câu trả lời mẫu chuẩn xác của Kstudy)</li>
              <li>Cột 4: <strong>Từ khóa (Tags)</strong> (cách nhau bởi dấu phẩy)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={!file || loading}
            onClick={handleUpload}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang xử lý & lưu...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Nạp vào Bot ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
