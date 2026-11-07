import { AppUser, UserRole } from "./types";

export const USERS_STORAGE_KEY = "omnichat.users.v1";
export const AUTH_USER_STORAGE_KEY = "omnichat.current_user.v1";

export const DEFAULT_USERS: AppUser[] = [
  {
    id: "usr_admin",
    username: "admin",
    name: "Ban Giám Đốc (Admin)",
    role: "admin",
    password: "goldenpalace2026",
    email: "admin@goldenpalace.vn",
    phone: "0228 6595 959",
    title: "Quản trị viên hệ thống",
    department: "Ban Điều Hành",
    active: true,
    createdAt: "2026-11-01T08:00:00.000Z",
  },
  {
    id: "usr_chinh",
    username: "chinh",
    name: "Trần Vân Chinh",
    role: "manager",
    password: "goldenpalace2026",
    email: "chinh.tv@goldenpalace.vn",
    phone: "0912 345 678",
    title: "Quản lý Marketing & Vận hành",
    department: "Phòng Marketing & CSKH",
    active: true,
    createdAt: "2026-11-02T08:00:00.000Z",
  },
  {
    id: "usr_ngockhanh",
    username: "ngockhanh",
    name: "Ngọc Khánh",
    role: "staff",
    password: "goldenpalace2026",
    email: "khanh.vn@goldenpalace.vn",
    phone: "0934 567 890",
    title: "Chuyên viên tư vấn tiệc cưới",
    department: "Đội Tư Vấn Tiệc",
    active: true,
    createdAt: "2026-11-03T08:00:00.000Z",
  },
  {
    id: "usr_thuha",
    username: "thuha",
    name: "Thu Hà",
    role: "staff",
    password: "goldenpalace2026",
    email: "ha.nt@goldenpalace.vn",
    phone: "0945 678 901",
    title: "Chuyên viên sự kiện & hội nghị",
    department: "Đội Tư Vấn Hội Nghị",
    active: true,
    createdAt: "2026-11-04T08:00:00.000Z",
  },
  {
    id: "usr_hoanglong",
    username: "hoanglong",
    name: "Hoàng Long",
    role: "staff",
    password: "goldenpalace2026",
    email: "long.th@goldenpalace.vn",
    phone: "0967 890 123",
    title: "Chuyên viên chăm sóc khách hàng",
    department: "Đội CSKH Đa Kênh",
    active: true,
    createdAt: "2026-11-05T08:00:00.000Z",
  },
];

let memoryUsers: AppUser[] = [...DEFAULT_USERS];

// Helper to safely access browser localStorage
function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadUsersFromStorage(): AppUser[] {
  if (!isClient()) return [...memoryUsers];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      saveUsersToStorage(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryUsers = parsed;
      return parsed;
    }
  } catch {
    // Return defaults on parse error
  }
  return DEFAULT_USERS;
}

export function saveUsersToStorage(users: AppUser[]): void {
  memoryUsers = [...users];
  if (!isClient()) return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event("omnichat-users-changed"));
  } catch (err) {
    console.error("Failed to save users to storage", err);
  }
}

export function addUser(input: {
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
}): AppUser {
  const users = loadUsersFromStorage();
  const cleanUsername = input.username.trim().toLowerCase();
  
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    throw new Error(`Tên đăng nhập "${input.username}" đã tồn tại. Vui lòng chọn tên khác.`);
  }

  const cleanPassword = input.password?.trim() || "goldenpalace2026";
  if (cleanPassword.length < 6) {
    throw new Error("Mật khẩu phải có tối thiểu 6 ký tự.");
  }

  const newUser: AppUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: input.name.trim(),
    role: input.role,
    password: cleanPassword,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    title: input.title?.trim() || (input.role === "admin" ? "Quản trị viên" : input.role === "manager" ? "Quản lý" : "Nhân viên tư vấn"),
    department: input.department?.trim() || "Golden Palace",
    active: true,
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [...users, newUser];
  saveUsersToStorage(nextUsers);
  return newUser;
}

export function updateUser(
  id: string,
  updates: Partial<Omit<AppUser, "id" | "createdAt">>
): AppUser {
  const users = loadUsersFromStorage();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error("Không tìm thấy người dùng cần cập nhật.");
  }

  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    const existing = users.find((u) => u.username.toLowerCase() === cleanUsername && u.id !== id);
    if (existing) {
      throw new Error(`Tên đăng nhập "${updates.username}" đã được sử dụng.`);
    }
    updates.username = cleanUsername;
  }

  if (updates.password !== undefined) {
    const cleanPass = updates.password.trim();
    if (cleanPass.length > 0) {
      if (cleanPass.length < 6) {
        throw new Error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      }
      updates.password = cleanPass;
    } else {
      // If empty string or whitespaces passed, keep existing password
      delete updates.password;
    }
  }

  const updatedUser: AppUser = {
    ...users[index],
    ...updates,
  };

  users[index] = updatedUser;
  saveUsersToStorage(users);
  return updatedUser;
}

export function deleteUser(id: string, currentUserId?: string): void {
  if (id === currentUserId) {
    throw new Error("Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình.");
  }
  const users = loadUsersFromStorage();
  const nextUsers = users.filter((u) => u.id !== id);
  if (nextUsers.length === users.length) {
    throw new Error("Không tìm thấy người dùng cần xóa.");
  }
  saveUsersToStorage(nextUsers);
}

export function getStaffAndManagers(): AppUser[] {
  const users = loadUsersFromStorage();
  return users.filter((u) => u.active && (u.role === "staff" || u.role === "manager" || u.role === "admin"));
}
