-- Smart placement confidence + smart routing/placement settings

ALTER TABLE public.patches
  ADD COLUMN IF NOT EXISTS placement_confidence TEXT
    CHECK (placement_confidence IS NULL OR placement_confidence IN ('high', 'medium', 'low'));

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS smart_routing BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS smart_placement BOOLEAN NOT NULL DEFAULT TRUE;
