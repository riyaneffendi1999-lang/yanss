-- Add new role tiers
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'head';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ast_spv';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';