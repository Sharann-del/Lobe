-- Reminder events: lightweight calendar events (not database entries / pages).

CREATE TYPE public.reminder_color AS ENUM (
  'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'
);

CREATE TYPE public.recurrence_frequency AS ENUM (
  'daily', 'weekly', 'monthly', 'yearly'
);

CREATE TABLE public.reminder_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  date        DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  is_checked  BOOLEAN NOT NULL DEFAULT FALSE,
  color       public.reminder_color NOT NULL DEFAULT 'blue',
  recurrence_rule JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reminder_events IS
  'Lightweight calendar reminder events (distinct from pages / database entries).';

CREATE INDEX reminder_events_workspace_date_idx
  ON public.reminder_events (workspace_id, date);

CREATE INDEX reminder_events_user_idx
  ON public.reminder_events (user_id);

CREATE TABLE public.recurrence_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES public.reminder_events (id) ON DELETE CASCADE,
  frequency    public.recurrence_frequency NOT NULL,
  interval     INT NOT NULL DEFAULT 1 CHECK (interval >= 1),
  days_of_week INT[] DEFAULT '{}',
  end_date     DATE,
  count        INT CHECK (count IS NULL OR count >= 1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.recurrence_rules IS
  'RRULE-style recurrence definitions attached to reminder events.';

CREATE INDEX recurrence_rules_event_idx ON public.recurrence_rules (event_id);

-- updated_at triggers --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_reminder_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER reminder_events_set_updated_at
  BEFORE UPDATE ON public.reminder_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_reminder_events_updated_at();

CREATE OR REPLACE FUNCTION public.handle_recurrence_rules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER recurrence_rules_set_updated_at
  BEFORE UPDATE ON public.recurrence_rules
  FOR EACH ROW EXECUTE PROCEDURE public.handle_recurrence_rules_updated_at();

-- RLS -----------------------------------------------------------------------

ALTER TABLE public.reminder_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_events_select_members"
  ON public.reminder_events FOR SELECT
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "reminder_events_insert_editors"
  ON public.reminder_events FOR INSERT
  WITH CHECK (
    public.workspace_can_edit_content(workspace_id, auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "reminder_events_update_editors"
  ON public.reminder_events FOR UPDATE
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()))
  WITH CHECK (public.workspace_can_edit_content(workspace_id, auth.uid()));

CREATE POLICY "reminder_events_delete_editors"
  ON public.reminder_events FOR DELETE
  USING (public.workspace_can_edit_content(workspace_id, auth.uid()));

CREATE POLICY "recurrence_rules_select_members"
  ON public.recurrence_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reminder_events re
      WHERE re.id = event_id
        AND public.is_workspace_member(re.workspace_id, auth.uid())
    )
  );

CREATE POLICY "recurrence_rules_insert_editors"
  ON public.recurrence_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reminder_events re
      WHERE re.id = event_id
        AND public.workspace_can_edit_content(re.workspace_id, auth.uid())
    )
  );

CREATE POLICY "recurrence_rules_update_editors"
  ON public.recurrence_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reminder_events re
      WHERE re.id = event_id
        AND public.workspace_can_edit_content(re.workspace_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reminder_events re
      WHERE re.id = event_id
        AND public.workspace_can_edit_content(re.workspace_id, auth.uid())
    )
  );

CREATE POLICY "recurrence_rules_delete_editors"
  ON public.recurrence_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reminder_events re
      WHERE re.id = event_id
        AND public.workspace_can_edit_content(re.workspace_id, auth.uid())
    )
  );
