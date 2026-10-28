import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
export function useNotifications(userId, role, enabled) {
  const [state, setState] = useState({ userId: null, items: [], error: "" });
  const revision = useRef(0);
  const invalidate = useCallback(() => {
    ++revision.current;
  }, []);
  const reload = useCallback(
    async (signal) => {
      const current = ++revision.current;
      if (!enabled || !userId || role === "soporte") return;
      try {
        const items = await api.notifications.list({ signal });
        if (!signal?.aborted && current === revision.current)
          setState({ userId, items, error: "" });
      } catch (error) {
        if (error.name !== "AbortError" && current === revision.current)
          setState((previous) => ({
            userId,
            items: previous.userId === userId ? previous.items : [],
            error: error.message,
          }));
      }
    },
    [enabled, userId, role],
  );
  useEffect(() => {
    if (!enabled || !userId || role === "soporte") return;
    const controller = new AbortController();
    // Remote subscription: state updates occur only after the awaited API response.
    // eslint-disable-next-line react/set-state-in-effect
    reload(controller.signal);
    const timer = setInterval(() => {
      if (!document.hidden) reload(controller.signal);
    }, 15000);
    const focus = () => reload(controller.signal);
    window.addEventListener("focus", focus);
    return () => {
      invalidate();
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [reload, enabled, userId, role, invalidate]);
  const markRead = async (ids) => {
    const current = ++revision.current;
    try {
      await api.notifications.markRead(ids);
      if (current === revision.current)
        setState((previous) =>
          previous.userId === userId
            ? {
                ...previous,
                error: "",
                items: previous.items.map((item) =>
                  ids.includes(item.id) ? { ...item, read: true } : item,
                ),
              }
            : previous,
        );
    } catch (error) {
      if (current === revision.current)
        setState((previous) => ({ ...previous, userId, error: error.message }));
    }
  };
  const visible = enabled && role !== "soporte" && state.userId === userId;
  return {
    notifications: visible ? state.items : [],
    notificationError: visible ? state.error : "",
    reloadNotifications: () => reload(),
    markNotificationsRead: markRead,
  };
}
