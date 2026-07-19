-- Migration 014: Add phone column to admin_users

ALTER TABLE "public"."admin_users"
ADD COLUMN IF NOT EXISTS "phone" text;
