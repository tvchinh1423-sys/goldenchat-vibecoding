import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20261105_golden_palace_crm.sql",
    import.meta.url,
  ),
  "utf8",
);
async function database(legacy = false) {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;",
  );
  if (legacy)
    await db.exec(`CREATE TABLE leads(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, phone text NOT NULL, email text, demand_notes text, status text DEFAULT 'new', assigned_sales text, created_at timestamptz DEFAULT now());
    INSERT INTO leads(full_name,phone,demand_notes,status,assigned_sales) VALUES ('Khách cũ','0912345678','Tiệc doanh nghiệp','booked','Hiền');`);
  await db.exec(migration);
  return db;
}
test("Postgres migration preserves legacy demand and N3 mapping, reruns safely and blocks anonymous reads", async () => {
  const db = await database(true);
  try {
    await db.exec(migration);
    const { rows } = await db.query<{
      stage: string;
      notes: string;
      assigned_to: string;
    }>("SELECT stage,notes,assigned_to FROM leads");
    assert.deepEqual(rows[0], {
      stage: "N3",
      notes: "Tiệc doanh nghiệp",
      assigned_to: "Hiền",
    });
    await assert.rejects(
      db.exec(
        "INSERT INTO leads(full_name,phone) VALUES ('Trùng số','+84 912.345.678')",
      ),
      (e: unknown) => (e as { code: string }).code === "23505",
    );
    await db.exec("SET ROLE anon");
    await assert.rejects(
      db.query("SELECT * FROM leads"),
      (e: unknown) => (e as { code: string }).code === "42501",
    );
    await assert.rejects(
      db.query("SELECT crm_save_booking('{}'::jsonb,null)"),
      (e: unknown) => (e as { code: string }).code === "42501",
    );
  } finally {
    await db.close();
  }
});
test("Postgres booking transaction enforces overlap, rollback, cancellation and future appointments", async () => {
  const db = await database();
  try {
    await db.exec("SET ROLE service_role");
    const { rows } = await db.query<{ id: string }>(
      "INSERT INTO leads(full_name,phone,stage) VALUES ('Khách A','0912345678','N1'),('Khách B','0987654321','N4') RETURNING id",
    );
    const time = new Date(Date.now() + 7 * 86400000).toISOString();
    const input = {
      lead_id: rows[0].id,
      appointment_time: time,
      event_type: "xem_sanh",
      guests_count: 2,
      assigned_staff: "Ngọc Khánh",
      notes: "Xem sảnh",
    };
    const save = async (v: unknown, id: string | null = null) =>
      (
        await db.query<{ id: string }>(
          "SELECT crm_save_booking($1::jsonb,$2::uuid) AS id",
          [JSON.stringify(v), id],
        )
      ).rows[0].id;
    const id = await save(input);
    assert.equal(
      (
        await db.query<{ stage: string }>(
          "SELECT stage FROM leads WHERE id=$1",
          [rows[0].id],
        )
      ).rows[0].stage,
      "N3",
    );
    // Lịch thứ 2 cùng nhân viên trong khung 30 phút: CHO PHÉP (tối đa 2 lịch 1 lúc)
    const id2 = await save({
      ...input,
      lead_id: rows[1].id,
      assigned_staff: " ngọc khánh ",
      appointment_time: new Date(Date.parse(time) + 10 * 60000).toISOString(),
    });
    assert.equal(
      (
        await db.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM bookings",
        )
      ).rows[0].count,
      2,
    );
    // Lịch thứ 3 cùng nhân viên trong khung 30 phút: BỊ TỪ CHỐI với mã 23P01 (vượt quá 2 lịch 1 lúc)
    await assert.rejects(
      save({
        ...input,
        lead_id: rows[1].id,
        assigned_staff: " ngọc khánh ",
        appointment_time: new Date(Date.parse(time) + 15 * 60000).toISOString(),
      }),
      (e: unknown) => (e as { code: string }).code === "23P01",
    );
    assert.equal(
      (
        await db.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM bookings",
        )
      ).rows[0].count,
      2,
    );
    assert.equal(
      (
        await db.query<{ stage: string }>(
          "SELECT stage FROM leads WHERE id=$1",
          [rows[1].id],
        )
      ).rows[0].stage,
      "N4",
    );
    // Lịch sau 30 phút (slot tiếp theo, mỗi lượt tư vấn 30 phút): CHO PHÉP
    await save({
      ...input,
      lead_id: rows[1].id,
      appointment_time: new Date(Date.parse(time) + 3600000).toISOString(),
    });
    // Hủy 1 lịch (id), sau đó lưu lịch thứ 3 (thay thế slot của id):
    await db.query("UPDATE bookings SET status='cancelled' WHERE id=$1", [id]);
    await save({ ...input, lead_id: rows[1].id });
    // Lúc này đã có 2 lịch active trong khung (id2 và lịch mới), nếu khôi phục lại id -> 3 lịch -> reject 23P01:
    await assert.rejects(
      db.query("UPDATE bookings SET status='confirmed' WHERE id=$1", [id]),
      (e: unknown) => (e as { code: string }).code === "23P01",
    );
    await assert.rejects(
      save({ ...input, appointment_time: "2020-01-01T00:00:00Z" }),
      (e: unknown) => (e as { code: string }).code === "22023",
    );
    assert.equal(
      (
        await db.query<{ stage: string }>(
          "SELECT stage FROM leads WHERE id=$1",
          [rows[1].id],
        )
      ).rows[0].stage,
      "N4",
    );
  } finally {
    await db.close();
  }
});
