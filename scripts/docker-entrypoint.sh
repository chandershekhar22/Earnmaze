#!/bin/sh
set -e

# Apply pending DB migrations before starting the server, when enabled.
# Controlled per-environment via RUN_MIGRATIONS in the env file:
#   - dev  → RUN_MIGRATIONS=true  (auto-migrate on every deploy)
#   - prod → unset/false          (keep prod migrations deliberate/manual)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
	echo "[entrypoint] RUN_MIGRATIONS=true — applying database migrations"
	node scripts/migrate.mjs
fi

exec node build/index.js
