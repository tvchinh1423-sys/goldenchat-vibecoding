export type UserRole = "admin" | "manager" | "staff";

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatar?: string;
  title?: string;
  department?: string;
  active: boolean;
  createdAt: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeLabel: string;
  description: string;
  color: string;
  bgLight: string;
  badgeColor: string;
  icon: string;
  permissions: {
    canAccessSettings: boolean;
    canManageUsers: boolean;
    canEditTraining: boolean;
    canAssignChat: boolean;
    canChat: boolean;
    canAccessCRM: boolean;
    canAccessReports: boolean;
  };
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    role: "admin",
    label: "Quản trị viên (Admin)",
    badgeLabel: "👑 Admin",
    description: "Toàn quyền hệ thống, cấu hình kênh, phân công chat và quản lý người dùng",
    color: "text-purple-700",
    bgLight: "bg-purple-50",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "ShieldAlert",
    permissions: {
      canAccessSettings: true,
      canManageUsers: true,
      canEditTraining: true,
      canAssignChat: true,
      canChat: true,
      canAccessCRM: true,
      canAccessReports: true,
    },
  },
  manager: {
    role: "manager",
    label: "Quản lý vận hành",
    badgeLabel: "💼 Quản lý",
    description: "Toàn quyền vận hành, quản lý người dùng, phân công chat (ngoại trừ cài đặt hệ thống)",
    color: "text-blue-700",
    bgLight: "bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "ShieldCheck",
    permissions: {
      canAccessSettings: false, // Quản lý KHÔNG được truy cập cấu hình hệ thống
      canManageUsers: true,     // Quản lý ĐƯỢC thêm, sửa, xóa người dùng
      canEditTraining: true,    // Quản lý ĐƯỢC huấn luyện bot & tri thức
      canAssignChat: true,      // Quản lý ĐƯỢC chỉ định phiên chat cho nhân viên
      canChat: true,
      canAccessCRM: true,
      canAccessReports: true,
    },
  },
  staff: {
    role: "staff",
    label: "Nhân viên tư vấn & CSKH",
    badgeLabel: "🎧 Nhân viên",
    description: "Trực chat đa kênh, truy cập danh sách khách hàng & lịch hẹn tư vấn",
    color: "text-emerald-700",
    bgLight: "bg-emerald-50",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "Headphones",
    permissions: {
      canAccessSettings: false,
      canManageUsers: false,
      canEditTraining: false, // Chỉ xem/thử bot
      canAssignChat: false,   // Nhân viên không tự phân công cho người khác
      canChat: true,
      canAccessCRM: true,
      canAccessReports: true,
    },
  },
};
