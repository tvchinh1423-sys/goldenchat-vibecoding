"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AppUser, UserRole, ROLE_CONFIGS } from "@/lib/auth/types";
import { addUser, updateUser, deleteUser } from "@/lib/auth/store";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  Edit2,
  Trash2,
  X,
  Check,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
  KeyRound,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerHaptic } from "@/lib/mobile/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UserManagementModal({ open, onClose }: Props) {
  const { users, currentUser, role, canManageUsers, refreshUsers } = useAuth();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
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

  if (!open) return null;

  if (!canManageUsers) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Quyền Hạn Không Đủ</h3>
          <p className="text-xs text-slate-500">
            Chỉ có <span className="font-bold text-purple-700">Quản trị viên (Admin)</span> hoặc <span className="font-bold text-blue-700">Quản lý</span> mới có quyền quản trị người dùng.
          </p>
          <Button onClick={onClose} className="w-full">
            Đã hiểu & Đóng
          </Button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quản Lý Người Dùng & Phân Quyền
              </h2>
              <p className="text-xs text-slate-500">
                Quản lý danh sách nhân sự, phân cấp vai trò (Admin / Quản lý / Nhân viên)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Add / Edit Form Modal Inline */}
          {(isAdding || editingUser) ? (
            <form onSubmit={handleSave} className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
              <div className="flex items-center justify-between">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="sm:col-span-2">
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
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Danh sách tài khoản ({users.length}):
              </span>
              <Button
                size="sm"
                onClick={handleStartAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm người dùng</span>
              </Button>
            </div>
          )}

          {/* User List */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {users.map((u) => {
              const uRoleConfig = ROLE_CONFIGS[u.role];
              const isCurrent = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-xs ${
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
                        <span className="text-xs font-bold text-slate-900">
                          {u.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${uRoleConfig.badgeColor}`}
                        >
                          {uRoleConfig.badgeLabel}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            Tài khoản của bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>@{u.username}</span>
                        <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{u.password ? "••••••••" : "Mặc định"}</span>
                        </span>
                        {u.title && <span>· {u.title}</span>}
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(u)}
                      className="h-8 px-2 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      title="Sửa thông tin"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      <span>Sửa</span>
                    </Button>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(u)}
                        className="h-8 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xóa người dùng"
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

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <p className="text-[11px]">
            💡 Quản lý có thể thêm, sửa, đổi mật khẩu, xóa người dùng và chỉ định ca trực.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
