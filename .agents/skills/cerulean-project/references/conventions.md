# Cerulean Conventions Reference

## API surface (`/api/v1/*`)

All routes require session cookie or `Authorization: Bearer cer_...`.

Key paths: workspace, messages, insights, document, blocks, patches, graph/sync, export, settings, api-keys, ai/run.

## Patch model

AI changes create **pending patches**. User accepts/rejects in web UI or via MCP `cerulean_accept_patch` / `cerulean_reject_patch`.

## Chat streaming

When persistence on: save message once after stream completes (`finalizeMessage`), not per token.

## Migrations

Apply in order: `supabase/migrations/001_initial_schema.sql`, then `002_username_and_fks.sql`.

Passwords in Supabase Auth only; `profiles.username` for login.
