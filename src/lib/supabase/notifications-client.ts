/**
 * Persistencia de notificaciones in-app desde el BROWSER.
 *
 * Solo permite crear notificaciones PARA EL USUARIO ACTUAL (RLS:
 * notifications_insert_own). Lo usa el listener de OneSignal para guardar la
 * push recibida como notificación in-app. El broadcast a otros usuarios va por
 * el servidor (src/lib/notifications.ts, service role).
 */
import { supabase } from "./client";

export type NotificationType =
  | "vencimiento_tarjeta"
  | "promocion"
  | "recordatorio"
  | "sistema"
  | "info"
  | "warning"
  | "success"
  | "error";

export interface OwnNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/** Inserta una notificación para el usuario actual (auth.uid() === userId). */
export const saveOwnNotification = async (
  n: OwnNotificationInput
): Promise<void> => {
  const { error } = await supabase.from("notifications").insert({
    user_id: n.userId,
    title: n.title,
    body: n.message,
    type: n.type,
    read: false,
  });
  if (error) {
    console.error("Error guardando notificación in-app:", error);
    throw error;
  }
};
