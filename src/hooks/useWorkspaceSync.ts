"use client";

import { useEffect, useState } from "react";
import { isPersistenceEnabled } from "@/lib/config";
import { workspaceApi } from "@/lib/api/workspace-client";

export function useWorkspaceSync() {
  const [ready, setReady] = useState(!isPersistenceEnabled());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPersistenceEnabled()) return;

    workspaceApi
      .load()
      .then(async () => {
        if (isPersistenceEnabled()) {
          await workspaceApi.syncGraph().catch(() => {});
        }
        setReady(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load workspace");
        setReady(true);
      });
  }, []);

  return { ready, error, persistenceEnabled: isPersistenceEnabled() };
}

export { workspaceApi };
