"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_CONFIGS, UserRole, AppUser } from "@/lib/auth/types";
import { addUser, updateUser, deleteUser } from "@/lib/auth/store";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  Phone,
  Mail,
  Building2,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { triggerHaptic } from "@/lib/mobile/haptics";

export default function UsersPage() {
  const { users, currentUser, role, canManageUsers, refreshUsers } = useAuth();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role: "staff" as UserRole,
    password: "",
    phone: "",
    email: "",
    title: "",
    department: "Đội Tư Vấn Tiệc",
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!canManageUsers) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Truy Cập Bị Giới Hạn · Cần Quyền Quản Lý Hoặc Admin
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Tài khoản hiện tại của bạn là <span className="font-bold text-emerald-700">Nhân viên</span>. Chức năng Quản lý người dùng chỉ dành riêng cho <span className="font-bold text-purple-700">Admin</span> và <span className="font-bold text-blue-700">Quản lý</span>.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link href="/inbox">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                Quay lại Hộp thư
              </Button>
            </Link>
            <Link href="/leads">
              <Button variant="outline" className="text-xs">
                Vào Quản lý Lead
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleStartAdd = () => {
    triggerHaptic("light");
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      name: "",
      username: "",
      role: "staff",
      password: "",
      phone: "",
      email: "",
      title: "Chuyên viên tư vấn",
      department: "Đội Tư Vấn Tiệc",
    });
    setError("");
    setSuccess("");
    setIsAdding(true);
  };

  const handleStartEdit = (user: AppUser) => {
    triggerHaptic("light");
    setIsAdding(false);
    setShowPassword(false);
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      password: "",
      phone: user.phone || "",
      email: user.email || "",
      title: user.title || "",
      department: user.department || "Golden Palace",
    });
    setError("");
    setSuccess("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic("medium");
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.username.trim()) {
      setError("Vui lòng điền Họ tên và Tên đăng nhập.");
      return;
    }

    if (isAdding) {
      if (!formData.password.trim()) {
        setError("Vui lòng nhập mật khẩu cho tài khoản mới (tối thiểu 6 ký tự).");
        return;
      }
      if (formData.password.trim().length < 6) {
        setError("Mật khẩu phải có tối thiểu 6 ký tự.");
        return;
      }
    } else if (editingUser) {
      if (formData.password.trim() && formData.password.trim().length < 6) {
        setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
        return;
      }
    }

    try {
      if (isAdding) {
        addUser({
          name: formData.name,
          username: formData.username,
          role: formData.role,
          password: formData.password.trim() || undefined,
          phone: formData.phone,
          email: formData.email,
          title: formData.title,
          department: formData.department,
        });
        setSuccess(`Đã tạo người dùng "${formData.name}" thành công!`);
        setIsAdding(false);
      } else if (editingUser) {
        updateUser(editingUser.id, {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          password: formData.password.trim() || undefined,
          phone: formData.phone,
          email: formData.email,
          title: formData.title,
          department: formData.department,
        });
        setSuccess(`Đã cập nhật người dùng "${formData.name}" thành công!`);
        setEditingUser(null);
      }
      refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác không thành công.");
    }
  };

  const handleDelete = (user: AppUser) => {
    triggerHaptic("heavy");
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}" (@${user.username})?`)) {
      return;
    }

    try {
      deleteUser(user.id, currentUser?.id);
      setSuccess(`Đã xóa người dùng "${user.name}".`);
      refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa người dùng.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Phân Quyền & Tổ Chức
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Người Dùng & Nhân Sự</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị viên và Quản lý có quyền thêm, sửa, xóa người dùng và phân quyền hệ thống
          </p>
        </div>

        <Button
          onClick={handleStartAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm người dùng mới</span>
        </Button>
      </div>

      {/* Notices */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Inline Form */}
      {(isAdding || editingUser) && (
        <form onSubmit={handleSave} className="p-6 rounded-3xl border border-blue-200 bg-blue-50/50 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>{isAdding ? "Thêm Người Dùng Mới" : `Sửa Người Dùng: ${editingUser?.name}`}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingUser(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Hủy bỏ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên *
              </label>
              <Input
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập (Username) *
              </label>
              <Input
                required
                placeholder="Ví dụ: nguyenvana"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="text-xs rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  {isAdding ? "Mật khẩu đăng nhập *" : "Mật khẩu mới"}
                </span>
                {editingUser && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Để trống nếu giữ nguyên)
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required={isAdding}
                  placeholder={
                    isAdding
                      ? "Tối thiểu 6 ký tự"
                      : "Nhập để đổi mật khẩu mới"
                  }
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="text-xs rounded-xl bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vai trò phân quyền *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-9"
              >
                <option value="staff">🎧 Nhân viên (Trực chat, quản lý khách & tư vấn)</option>
                <option value="manager">💼 Quản lý (Toàn quyền vận hành & quản lý user)</option>
                <option value="admin">👑 Admin (Toàn quyền hệ thống & cấu hình chung)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <Input
                placeholder="Ví dụ: 0912 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-xs rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chức danh / Tiêu đề
              </label>
              <Input
                placeholder="Ví dụ: Chuyên viên tư vấn tiệc"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-xs rounded-xl bg-white"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bộ phận / Phòng ban
              </label>
              <Input
                placeholder="Ví dụ: Đội Tư Vấn Tiệc"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="text-xs rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setEditingUser(null);
              }}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {isAdding ? "Tạo người dùng" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      )}

      {/* Users Table / Cards */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Danh sách nhân sự & quyền hạn ({users.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => {
            const uRoleConfig = ROLE_CONFIGS[u.role];
            const isCurrent = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl font-bold text-sm flex items-center justify-center text-white shrink-0 shadow-sm ${
                      u.role === "admin"
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                        : u.role === "manager"
                        ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
                        : "bg-gradient-to-tr from-emerald-600 to-teal-600"
                    }`}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {u.name}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${uRoleConfig.badgeColor}`}
                      >
                        {uRoleConfig.badgeLabel}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                          Đang đăng nhập
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>@{u.username}</span>
                      <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{u.password ? "••••••••" : "Mặc định"}</span>
                      </span>
                      {u.title && <span>· {u.title}</span>}
                      {u.department && <span>· {u.department}</span>}
                      {u.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {uRoleConfig.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(u)}
                    className="h-8 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Sửa</span>
                  </Button>
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(u)}
                      className="h-8 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
