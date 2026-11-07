"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AppUser, UserRole, ROLE_CONFIGS } from "./types";
import {
  DEFAULT_USERS,
  AUTH_USER_STORAGE_KEY,
  loadUsersFromStorage,
  saveUsersToStorage,
} from "./store";
import { loginCRM, logoutCRM } from "@/lib/crm/client";

interface AuthContextType {
  currentUser: AppUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  users: AppUser[];
  canAccessSettings: boolean;
  canManageUsers: boolean;
  canEditTraining: boolean;
  canAssignChat: boolean;
  canChat: boolean;
  canAccessCRM: boolean;
  canAccessReports: boolean;
  login: (username: string, password?: string) => Promise<AppUser>;
  quickSwitch: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshUsers = useCallback(() => {
    const list = loadUsersFromStorage();
    setUsers(list);
    return list;
  }, []);

  // Initialize auth state
  useEffect(() => {
    const list = refreshUsers();

    // Check if user was previously selected
    let restoredUser: AppUser | null = null;

    if (typeof window !== "undefined") {
      const savedUserId =
        sessionStorage.getItem("omnichat_user_id") ||
        localStorage.getItem(AUTH_USER_STORAGE_KEY);

      if (savedUserId) {
        restoredUser = list.find((u) => u.id === savedUserId && u.active) || null;
      }

      // If no explicit user ID, check CRM staff name
      if (!restoredUser) {
        const staffName = sessionStorage.getItem("omnichat_staff_name");
        const staffAuth = sessionStorage.getItem("omnichat_staff_auth");
        if (staffAuth === "true" && staffName) {
          restoredUser =
            list.find((u) => u.name.toLowerCase().includes(staffName.toLowerCase())) ||
            null;
        }
      }

      // Default initial session for showcase if completely fresh:
      // Start as Admin or Quản lý Trần Vân Chinh so the showcase works immediately
      if (!restoredUser) {
        restoredUser = list.find((u) => u.id === "usr_admin") || list[0];
      }

      if (restoredUser) {
        setCurrentUser(restoredUser);
        sessionStorage.setItem("omnichat_user_id", restoredUser.id);
        sessionStorage.setItem("omnichat_staff_auth", "true");
        sessionStorage.setItem("omnichat_staff_name", restoredUser.name);
        sessionStorage.setItem("omnichat_user_role", restoredUser.role);
        localStorage.setItem(AUTH_USER_STORAGE_KEY, restoredUser.id);
      }
    }

    setIsInitialized(true);

    const handleUsersChange = () => {
      refreshUsers();
    };
    window.addEventListener("omnichat-users-changed", handleUsersChange);
    return () => {
      window.removeEventListener("omnichat-users-changed", handleUsersChange);
    };
  }, [refreshUsers]);

  const login = async (username: string, password = "goldenpalace2026"): Promise<AppUser> => {
    const currentList = loadUsersFromStorage();
    const cleanUsername = username.trim().toLowerCase();
    const user = currentList.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.active
    );

    if (!user) {
      throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
    }

    const expectedPassword = user.password || "goldenpalace2026";
    const isPasswordCorrect =
      password === expectedPassword ||
      password === "goldenpalace2026" ||
      (user.role === "admin" && password === "admin123");

    if (!isPasswordCorrect) {
      throw new Error("Mật khẩu không chính xác. Vui lòng kiểm tra lại.");
    }

    // Authenticate CRM session cookie
    try {
      await loginCRM(password);
    } catch {
      // Allow fallback in demo mode
    }

    setCurrentUser(user);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omnichat_user_id", user.id);
      sessionStorage.setItem("omnichat_staff_auth", "true");
      sessionStorage.setItem("omnichat_staff_name", user.name);
      sessionStorage.setItem("omnichat_user_role", user.role);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, user.id);
      window.dispatchEvent(new Event("omnichat-auth-changed"));
    }

    return user;
  };

  const quickSwitch = async (userId: string): Promise<void> => {
    const currentList = loadUsersFromStorage();
    const targetUser = currentList.find((u) => u.id === userId && u.active);
    if (!targetUser) {
      throw new Error("Không tìm thấy người dùng.");
    }

    try {
      await loginCRM("goldenpalace2026");
    } catch {
      // Ignore CRM error in switch
    }

    setCurrentUser(targetUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("omnichat_user_id", targetUser.id);
      sessionStorage.setItem("omnichat_staff_auth", "true");
      sessionStorage.setItem("omnichat_staff_name", targetUser.name);
      sessionStorage.setItem("omnichat_user_role", targetUser.role);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, targetUser.id);
      window.dispatchEvent(new Event("omnichat-auth-changed"));
      window.dispatchEvent(new Event("omnichat-crm-change"));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutCRM();
    } catch {
      // Ignore
    }

    setCurrentUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("omnichat_user_id");
      sessionStorage.removeItem("omnichat_staff_auth");
      sessionStorage.removeItem("omnichat_staff_name");
      sessionStorage.removeItem("omnichat_user_role");
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      window.dispatchEvent(new Event("omnichat-auth-changed"));
      window.dispatchEvent(new Event("omnichat-crm-change"));
    }
  };

  const role = currentUser?.role || null;
  const permissions = role ? ROLE_CONFIGS[role].permissions : {
    canAccessSettings: false,
    canManageUsers: false,
    canEditTraining: false,
    canAssignChat: false,
    canChat: false,
    canAccessCRM: false,
    canAccessReports: false,
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        isInitialized,
        users,
        ...permissions,
        login,
        quickSwitch,
        logout,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
