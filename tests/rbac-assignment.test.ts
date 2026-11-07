import test from "node:test";
import assert from "node:assert/strict";
import { ROLE_CONFIGS } from "../lib/auth/types";
import {
  DEFAULT_USERS,
  addUser,
  updateUser,
  deleteUser,
  loadUsersFromStorage,
  saveUsersToStorage,
} from "../lib/auth/store";
import { filterConversations } from "../lib/inbox/helpers";
import { parseSnapshot } from "../lib/inbox/storage";
import { createDemoConversations } from "../lib/inbox/demo-data";
import type { Conversation, InboxFilters } from "../lib/inbox/types";

test("RBAC: verifies exact role boundaries for admin, manager, and staff", () => {
  // Admin: Toàn quyền
  assert.equal(ROLE_CONFIGS.admin.permissions.canAccessSettings, true);
  assert.equal(ROLE_CONFIGS.admin.permissions.canManageUsers, true);
  assert.equal(ROLE_CONFIGS.admin.permissions.canEditTraining, true);
  assert.equal(ROLE_CONFIGS.admin.permissions.canAssignChat, true);
  assert.equal(ROLE_CONFIGS.admin.permissions.canChat, true);
  assert.equal(ROLE_CONFIGS.admin.permissions.canAccessCRM, true);

  // Quản lý: Toàn quyền ngoại trừ cấu hình hệ thống, được quyền thêm sửa xóa người dùng & chỉ định chat
  assert.equal(
    ROLE_CONFIGS.manager.permissions.canAccessSettings,
    false,
    "Quản lý không được truy cập cấu hình hệ thống",
  );
  assert.equal(
    ROLE_CONFIGS.manager.permissions.canManageUsers,
    true,
    "Quản lý được quyền thêm, sửa, xóa người dùng",
  );
  assert.equal(
    ROLE_CONFIGS.manager.permissions.canEditTraining,
    true,
    "Quản lý được quyền cấu hình tri thức bot",
  );
  assert.equal(
    ROLE_CONFIGS.manager.permissions.canAssignChat,
    true,
    "Quản lý có thể chỉ định phiên chat cho nhân viên cụ thể",
  );
  assert.equal(ROLE_CONFIGS.manager.permissions.canChat, true);
  assert.equal(ROLE_CONFIGS.manager.permissions.canAccessCRM, true);

  // Nhân viên: Trực chat, danh sách khách hàng, chăm sóc khách hàng; không quản trị hệ thống
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canAccessSettings,
    false,
    "Nhân viên không được truy cập cấu hình hệ thống",
  );
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canManageUsers,
    false,
    "Nhân viên không được quản lý người dùng",
  );
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canEditTraining,
    false,
    "Nhân viên chỉ ở chế độ thử bot, không sửa cấu hình bot",
  );
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canAssignChat,
    false,
    "Nhân viên không tự phân công phiên chat cho người khác",
  );
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canChat,
    true,
    "Nhân viên có quyền trực chat đa kênh",
  );
  assert.equal(
    ROLE_CONFIGS.staff.permissions.canAccessCRM,
    true,
    "Nhân viên có quyền truy cập danh sách khách hàng & phễu lead",
  );
});

test("User Management: default accounts and CRUD operations", () => {
  // 1. Verify default accounts
  assert.ok(DEFAULT_USERS.length >= 3);
  const admin = DEFAULT_USERS.find((u) => u.role === "admin");
  const manager = DEFAULT_USERS.find((u) => u.role === "manager");
  const staff = DEFAULT_USERS.find((u) => u.role === "staff");

  assert.ok(admin, "Có tài khoản Admin");
  assert.ok(manager, "Có tài khoản Quản lý");
  assert.ok(staff, "Có tài khoản Nhân viên");
  assert.equal(admin.username, "admin");
  assert.equal(manager.name, "Trần Vân Chinh");
  assert.equal(staff.name, "Ngọc Khánh");

  // 2. Test Add User
  const newUser = addUser({
    name: "Lê Thị Thu",
    username: "thule",
    role: "staff",
    phone: "0988776655",
    title: "Chuyên viên tư vấn tiệc",
  });
  assert.equal(newUser.name, "Lê Thị Thu");
  assert.equal(newUser.role, "staff");

  // 3. Reject duplicate username
  assert.throws(() => {
    addUser({
      name: "Trùng Tên",
      username: "thule",
      role: "staff",
    });
  });

  // 4. Update User
  const updated = updateUser(newUser.id, {
    title: "Trưởng nhóm tư vấn",
    role: "manager",
  });
  assert.equal(updated.title, "Trưởng nhóm tư vấn");
  assert.equal(updated.role, "manager");

  // 5. Delete User (prevent self delete)
  assert.throws(() => {
    deleteUser(newUser.id, newUser.id);
  });
  deleteUser(newUser.id, "another_id");
  const usersAfterDelete = loadUsersFromStorage();
  assert.ok(!usersAfterDelete.some((u) => u.id === newUser.id));
});

test("Chat Assignment: assign conversation to specific staff member and filter by 'mine'", () => {
  const conversations = createDemoConversations();
  const testConv = conversations[0];

  // Assign to Ngọc Khánh
  const assignedConv: Conversation = {
    ...testConv,
    assignedTo: "usr_ngockhanh",
    assignedStaffName: "Ngọc Khánh",
    assignedAt: new Date().toISOString(),
    assignedBy: "Trần Vân Chinh (Quản lý)",
    messages: [
      ...testConv.messages,
      {
        id: "sys_assign_1",
        sender: "bot",
        content: "🔔 Quản lý Trần Vân Chinh đã chỉ định phiên chat này cho: Ngọc Khánh.",
        createdAt: new Date().toISOString(),
      },
    ],
  };

  const allConversations = [assignedConv, ...conversations.slice(1)];

  // Snapshot roundtrip with assignedStaffName and string assignedTo
  const snapshotJson = JSON.stringify({
    version: 1,
    conversations: allConversations,
  });
  const parsed = parseSnapshot(snapshotJson);
  assert.equal(parsed[0].assignedStaffName, "Ngọc Khánh");
  assert.equal(parsed[0].assignedTo, "usr_ngockhanh");
  assert.equal(parsed[0].messages.length, testConv.messages.length + 1);

  // Filter tab "mine" for Ngọc Khánh
  const filtersForKhanh: InboxFilters = {
    query: "",
    tab: "mine",
    channels: [],
    hasBooking: false,
    hasContact: false,
    showArchived: false,
    currentUserId: "usr_ngockhanh",
    currentStaffName: "Ngọc Khánh",
  };
  const khanhConversations = filterConversations(allConversations, filtersForKhanh);
  assert.ok(
    khanhConversations.some((c) => c.id === testConv.id),
    "Hội thoại được chỉ định phải xuất hiện trong tab Của tôi của Ngọc Khánh",
  );

  // Filter tab "mine" for another staff member (Thu Hà)
  const filtersForHa: InboxFilters = {
    query: "",
    tab: "mine",
    channels: [],
    hasBooking: false,
    hasContact: false,
    showArchived: false,
    currentUserId: "usr_thuha",
    currentStaffName: "Thu Hà",
  };
  const haConversations = filterConversations(allConversations, filtersForHa);
  assert.ok(
    !haConversations.some((c) => c.id === testConv.id),
    "Hội thoại được chỉ định cho Ngọc Khánh không được xuất hiện trong tab Của tôi của Thu Hà",
  );
});
