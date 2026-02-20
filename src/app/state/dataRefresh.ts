import { useCallback, useEffect, useState } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();

export function triggerDataRefresh() {
  listeners.forEach((listener) => listener());
}

export function useDataRefresh() {
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handler = () => setRefreshToken((value) => value + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    triggerDataRefresh();
  }, []);

  return { refreshToken, triggerRefresh };
}
