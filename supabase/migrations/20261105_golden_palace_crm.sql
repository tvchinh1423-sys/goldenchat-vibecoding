-- Golden Palace CRM, one shared workspace. Apply manually in a TEST Supabase
-- project first. Preserves handoff/supabase_schema.sql and all existing records.
-- Requires PostgreSQL / Supabase; rolls back entirely if duplicates/conflicts exist.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(100) NOT NULL,
  phone varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email varchar(100),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS source varchar(20) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS stage varchar(10),
  ADD COLUMN IF NOT EXISTS assigned_to varchar(100),
  ADD COLUMN IF NOT EXISTS last_touched_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS inbox_reference varchar(100),
  ADD COLUMN IF NOT EXISTS event_date varchar(10),
  ADD COLUMN IF NOT EXISTS table_count integer;
-- Support both legacy schemas without removing status/demand_notes/course_interest.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='status') THEN
    EXECUTE 'UPDATE public.leads SET stage = CASE status WHEN ''contacting'' THEN ''N2'' WHEN ''booked'' THEN ''N3'' WHEN ''won'' THEN ''N4'' WHEN ''lost'' THEN ''N0'' ELSE ''N1'' END WHERE stage IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='demand_notes') THEN
    EXECUTE 'UPDATE public.leads SET notes = demand_notes WHERE (notes IS NULL OR notes = '''') AND demand_notes IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='assigned_sales') THEN
    EXECUTE 'UPDATE public.leads SET assigned_to = assigned_sales WHERE assigned_to IS NULL';
  END IF;
END $$;
UPDATE public.leads SET stage='N1' WHERE stage IS NULL;
ALTER TABLE public.leads ALTER COLUMN stage SET DEFAULT 'N1', ALTER COLUMN stage SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='crm_lead_stage' AND conrelid='public.leads'::regclass) THEN
    ALTER TABLE public.leads ADD CONSTRAINT crm_lead_stage CHECK (stage IN ('N1','N2','N3','N4','N5','N0'));
    ALTER TABLE public.leads ADD CONSTRAINT crm_table_count CHECK (table_count IS NULL OR table_count BETWEEN 1 AND 2000);
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.crm_phone_key(value text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path=public AS $$
  SELECT regexp_replace(regexp_replace(value, '[\s.\-]', '', 'g'), '^\+?84', '0');
$$;
-- Existing duplicate phones/references abort migration; review them manually.
CREATE UNIQUE INDEX IF NOT EXISTS crm_lead_phone ON public.leads(public.crm_phone_key(phone)) WHERE phone IS NOT NULL AND phone <> '';
CREATE UNIQUE INDEX IF NOT EXISTS crm_lead_inbox ON public.leads(inbox_reference) WHERE inbox_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  appointment_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_type varchar(50) DEFAULT 'xem_sanh',
  ADD COLUMN IF NOT EXISTS guests_count integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS assigned_staff varchar(100),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS appointment_end timestamptz;
UPDATE public.bookings SET appointment_end=appointment_time + interval '1 hour' WHERE appointment_end IS NULL;
ALTER TABLE public.bookings ALTER COLUMN appointment_end SET NOT NULL;
CREATE OR REPLACE FUNCTION public.crm_booking_period() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.appointment_end := NEW.appointment_time + interval '1 hour';
  IF NEW.status IN ('pending','confirmed') AND NEW.appointment_time <= now() THEN
    IF TG_OP='INSERT' THEN RAISE EXCEPTION 'Appointment must be in the future' USING ERRCODE='22023';
    ELSIF NEW.appointment_time IS DISTINCT FROM OLD.appointment_time OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Reschedule an expired appointment first' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_booking_period ON public.bookings;
CREATE TRIGGER crm_booking_period BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.crm_booking_period();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='crm_staff_no_overlap' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT crm_staff_no_overlap EXCLUDE USING gist (
      lower(btrim(assigned_staff)) WITH =,
      tstzrange(appointment_time, appointment_end, '[)') WITH &&
    ) WHERE (status IN ('pending','confirmed') AND assigned_staff IS NOT NULL AND assigned_staff <> '');
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS crm_bookings_lead ON public.bookings(lead_id);

CREATE OR REPLACE FUNCTION public.crm_save_booking(p_input jsonb, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE lead_uuid uuid := (p_input->>'lead_id')::uuid; booking_uuid uuid;
BEGIN
  -- Lock the lead and commit the schedule + N3 promotion as one transaction.
  PERFORM 1 FROM public.leads WHERE id=lead_uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead not found' USING ERRCODE='P0002'; END IF;
  IF (p_input->>'appointment_time')::timestamptz <= now()
     OR COALESCE(p_input->>'event_type','') NOT IN ('xem_sanh','thu_mon','tu_van_su_kien')
     OR COALESCE((p_input->>'guests_count')::integer,0) NOT BETWEEN 1 AND 50
     OR COALESCE(btrim(p_input->>'assigned_staff'),'')='' THEN
    RAISE EXCEPTION 'Invalid booking' USING ERRCODE='22023';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.bookings(lead_id,appointment_time,event_type,guests_count,assigned_staff,notes,status)
    VALUES (lead_uuid,(p_input->>'appointment_time')::timestamptz,p_input->>'event_type',(p_input->>'guests_count')::integer,btrim(p_input->>'assigned_staff'),COALESCE(p_input->>'notes',''),'pending')
    RETURNING id INTO booking_uuid;
  ELSE
    UPDATE public.bookings SET appointment_time=(p_input->>'appointment_time')::timestamptz,
      event_type=p_input->>'event_type',guests_count=(p_input->>'guests_count')::integer,
      assigned_staff=btrim(p_input->>'assigned_staff'),notes=COALESCE(p_input->>'notes',''),status='pending'
    WHERE id=p_id AND lead_id=lead_uuid RETURNING id INTO booking_uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found' USING ERRCODE='P0002'; END IF;
  END IF;
  UPDATE public.leads SET stage=CASE WHEN stage IN ('N1','N2') THEN 'N3' ELSE stage END,last_touched_at=now() WHERE id=lead_uuid;
  RETURN booking_uuid;
END $$;
-- The server CRM uses its own service-role client behind a workspace login.
-- Legacy Botcake's anon-key lead writes require a separate authenticated adapter.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads, public.bookings FROM anon, authenticated;
GRANT ALL ON public.leads, public.bookings TO service_role;
REVOKE ALL ON FUNCTION public.crm_save_booking(jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_save_booking(jsonb,uuid) TO service_role;
COMMIT;
