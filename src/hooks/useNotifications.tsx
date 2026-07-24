import { supabase } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type:
    | "vencimiento_tarjeta"
    | "promocion"
    | "recordatorio"
    | "sistema"
    | "info"
    | "warning"
    | "success"
    | "error";
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: Notification["type"];
  read: boolean;
  created_at: string;
}

/** Fila de public.notifications -> forma que consume la UI. */
function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.body ?? "",
    timestamp: new Date(row.created_at),
    read: row.read,
    type: row.type,
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    // Carga inicial (RLS ya limita a las del usuario).
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          console.error("Error obteniendo notificaciones:", err);
          setError("Error al cargar notificaciones");
          setLoading(false);
          return;
        }
        setNotifications((data ?? []).map((r) => rowToNotification(r as NotificationRow)));
        setError(null);
        setLoading(false);
      });

    // Realtime: reemplaza al onSnapshot de Firestore.
    const channel = supabase
      .channel(`notifications:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return;
          setNotifications((prev) => {
            if (payload.eventType === "INSERT") {
              const next = rowToNotification(payload.new as NotificationRow);
              if (prev.some((n) => n.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const updated = rowToNotification(payload.new as NotificationRow);
              return prev.map((n) => (n.id === updated.id ? updated : n));
            }
            if (payload.eventType === "DELETE") {
              const removedId = (payload.old as { id: string }).id;
              return prev.filter((n) => n.id !== removedId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimista: evita esperar al roundtrip realtime.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    const { error: err } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    if (err) {
      console.error("Error marcando notificación como leída:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error: err } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (err) {
      console.error("Error marcando todas como leídas:", err);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const { error: err } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    if (err) {
      console.error("Error eliminando notificación:", err);
    }
  }, []);

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
  };
};
