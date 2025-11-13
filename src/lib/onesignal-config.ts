import { Capacitor } from "@capacitor/core";
import { saveNotificationToFirestore } from "./notifications";

export const ONESIGNAL_CONFIG = {
  APP_ID: "ab94a58e-b696-4f40-89ef-24597d45fe56",
};

let oneSignalInitialized = false;
let notificationListenersSetup = false;

export const initializeOneSignal = async (firebaseUserId?: string) => {
  if (oneSignalInitialized) {
    return;
  }

  if (Capacitor.isNativePlatform()) {
    const OneSignal = (await import("onesignal-cordova-plugin")).default;
    OneSignal.initialize(ONESIGNAL_CONFIG.APP_ID);
    OneSignal.Notifications.requestPermission(true);
    oneSignalInitialized = true;
  } else {
    if (typeof window !== "undefined" && window.OneSignal) {
      try {
        if (!(window as any).OneSignalInitialized) {
          await window.OneSignal.init({
            appId: ONESIGNAL_CONFIG.APP_ID,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
          });
          (window as any).OneSignalInitialized = true;
        }
        oneSignalInitialized = true;

        if (firebaseUserId && !notificationListenersSetup) {
          setupNotificationListeners(firebaseUserId);
        }
      } catch (error) {
        console.error("Error inicializando OneSignal:", error);
      }
    }
  }
};

const setupNotificationListeners = (firebaseUserId: string) => {
  if (
    notificationListenersSetup ||
    typeof window === "undefined" ||
    !window.OneSignal
  ) {
    return;
  }

  try {
    if (window.OneSignal.on) {
      window.OneSignal.on("notificationDisplay", async (event: any) => {
        try {
          await saveNotificationToFirestore({
            userId: firebaseUserId,
            title: event.heading || "Nueva notificación",
            message: event.content || "",
            type: (event.data?.type as any) || "sistema",
          });
        } catch (error) {
          console.error("Error guardando notificación en Firestore:", error);
        }
      });
    }

    if ((window.OneSignal as any).push) {
      (window.OneSignal as any).push([
        "addListenerForNotificationOpened",
        async (data: any) => {
          try {
            await saveNotificationToFirestore({
              userId: firebaseUserId,
              title: data.heading || "Nueva notificación",
              message: data.content || "",
              type: (data.data?.type as any) || "sistema",
            });
          } catch (error) {
            console.error("Error guardando notificación en Firestore:", error);
          }
        },
      ]);
    }

    notificationListenersSetup = true;
  } catch (error) {
    console.error("Error configurando listeners de notificaciones:", error);
  }
};

export const setupNotificationListenersForUser = (firebaseUserId: string) => {
  if (typeof window === "undefined" || !window.OneSignal) {
    return;
  }
  setupNotificationListeners(firebaseUserId);
};

export const getOneSignalUserId = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    return null;
  }
  if (typeof window !== "undefined" && window.OneSignal) {
    return await window.OneSignal.getUserId();
  }
  return null;
};

export const getOneSignalPlayerId = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    return null;
  }
  if (typeof window !== "undefined" && window.OneSignal) {
    try {
      const userId = await window.OneSignal.getUserId();
      return userId;
    } catch (error) {
      console.error("Error obteniendo Player ID:", error);
      return null;
    }
  }
  return null;
};

export const isOneSignalEnabled = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    return true;
  } else {
    if (typeof window !== "undefined" && window.OneSignal) {
      return await window.OneSignal.isPushNotificationsEnabled();
    }
    return false;
  }
};
