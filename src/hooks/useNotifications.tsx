import { db } from "@/lib/firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: any;
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

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Usar la colección global de notificaciones
    const notificationsRef = collection(db, "notifications");
    // Filtrar solo las notificaciones del usuario actual
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Convertir timestamp a Date de manera segura
          let timestamp: Date;
          if (data.timestamp?.toDate) {
            // Timestamp de Firestore
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp instanceof Date) {
            // Ya es un Date
            timestamp = data.timestamp;
          } else if (typeof data.timestamp === 'string') {
            // String de fecha
            timestamp = new Date(data.timestamp);
          } else if (data.timestamp && typeof data.timestamp === 'object' && data.timestamp.seconds) {
            // Timestamp de Firestore como objeto
            timestamp = new Date(data.timestamp.seconds * 1000);
          } else {
            // Fallback: usar fecha actual
            timestamp = new Date();
          }

          notificationsData.push({
            id: doc.id,
            ...data,
            timestamp,
          } as Notification);
        });
        setNotifications(notificationsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error obteniendo notificaciones:", err);
        setError("Error al cargar notificaciones");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, `notifications/${notificationId}`);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const updatePromises = unreadNotifications.map((notification) =>
        markAsRead(notification.id)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error(
        "Error marcando todas las notificaciones como leídas:",
        error
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const notificationRef = doc(db, `notifications/${notificationId}`);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

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
