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
  } catch (error) {
    console.error("Error guardando notificación en Firestore:", error);
    throw error;
  }
};
