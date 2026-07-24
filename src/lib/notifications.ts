/**
 * Persistencia de notificaciones in-app en Supabase (public.notifications).
 *
 * Solo SERVIDOR: usa el cliente service-role (bypassa RLS). La tabla no tiene
 * policy de INSERT a propósito — las notificaciones las crea el backend
 * (ver api/notifications/send.ts). El usuario solo lee/actualiza/borra las
 * suyas (useNotifications).
 */
import { getAdminClient } from "@/lib/supabase/admin-server";

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type:
    | "vencimiento_tarjeta"
    | "promocion"
    | "recordatorio"
    | "sistema"
    | "info"
    | "warning"
    | "success"
    | "error";
  read?: boolean;
}

/** camelCase de la app -> fila de public.notifications. */
const toRow = (n: NotificationData) => ({
  user_id: n.userId,
  title: n.title,
  body: n.message,
  type: n.type,
  read: n.read ?? false,
});

/** Guarda una notificación para un usuario. */
export const saveNotification = async (
  notificationData: NotificationData
): Promise<void> => {
  const { error } = await getAdminClient()
    .from("notifications")
    .insert(toRow(notificationData));
  if (error) {
    console.error("Error guardando notificación:", error);
    throw error;
  }
};

/**
 * Guarda la misma notificación para TODOS los usuarios (broadcast in-app).
 * Un solo insert masivo en vez de N escrituras.
 */
export const saveNotificationForAllUsers = async (
  notification: Omit<NotificationData, "userId">
): Promise<void> => {
  const admin = getAdminClient();
  const { data: users, error: usersError } = await admin
    .from("profiles")
    .select("id");
  if (usersError) {
    console.error("Error listando usuarios para broadcast:", usersError);
    throw usersError;
  }

  const rows = (users ?? []).map((u) =>
    toRow({ ...notification, userId: u.id as string })
  );
  if (rows.length === 0) return;

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("Error guardando notificaciones (broadcast):", error);
    throw error;
  }
};
