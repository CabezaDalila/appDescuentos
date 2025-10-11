import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase";

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

/**
 * Guarda una notificación en Firestore
 */
export const saveNotificationToFirestore = async (
  notificationData: NotificationData
): Promise<void> => {
  try {
    const notification = {
      ...notificationData,
      read: notificationData.read || false,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, "notifications"), notification);
    console.log(
      "✅ Notificación guardada en Firestore:",
      notificationData.title
    );
  } catch (error) {
    console.error("❌ Error guardando notificación en Firestore:", error);
    throw error;
  }
};

/**
 * Envía notificación de vencimiento de tarjeta
 */
export const sendCardExpiryNotification = async (
  userId: string,
  cardName: string,
  expiryDate: string
): Promise<void> => {
  const title = `Tu tarjeta ${cardName} vence pronto`;
  const message = `Tu tarjeta ${cardName} termina el ${expiryDate}. Actualizá tus datos para no perder beneficios.`;

  await saveNotificationToFirestore({
    userId,
    title,
    message,
    type: "vencimiento_tarjeta",
  });
};

/**
 * Envía notificación de promoción
 */
export const sendPromotionNotification = async (
  userId: string,
  title: string,
  message: string
): Promise<void> => {
  await saveNotificationToFirestore({
    userId,
    title,
    message,
    type: "promocion",
  });
};

/**
 * Envía notificación de recordatorio
 */
export const sendReminderNotification = async (
  userId: string,
  title: string,
  message: string
): Promise<void> => {
  await saveNotificationToFirestore({
    userId,
    title,
    message,
    type: "recordatorio",
  });
};

/**
 * Envía notificación del sistema
 */
export const sendSystemNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error" = "info"
): Promise<void> => {
  await saveNotificationToFirestore({
    userId,
    title,
    message,
    type: type as any,
  });
};
