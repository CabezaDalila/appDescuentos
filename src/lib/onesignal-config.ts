import { Capacitor } from "@capacitor/core";

// Configuración de OneSignal
export const ONESIGNAL_CONFIG = {
  APP_ID: "ab94a58e-b696-4f40-89ef-24597d45fe56",
};

// Variable para controlar si ya se inicializó OneSignal
let oneSignalInitialized = false;

// Inicializar OneSignal según la plataforma
export const initializeOneSignal = async (userId?: string) => {
  // Evitar múltiples inicializaciones
  if (oneSignalInitialized) {
    return;
  }

  if (Capacitor.isNativePlatform()) {
<<<<<<< Updated upstream
    // Para Android/iOS - Inicialización correcta según las instrucciones
    const OneSignal = (await import('onesignal-cordova-plugin')).default;
    
    // Solo se ejecuta una vez al inicio de la app
    OneSignal.initialize(ONESIGNAL_CONFIG.APP_ID);
    OneSignal.Notifications.requestPermission(true);
=======
    // Para Android/iOS
    const OneSignal = (await import("onesignal-cordova-plugin")).default;
    OneSignal.initialize(ONESIGNAL_CONFIG.APP_ID);
    OneSignal.Notifications.requestPermission(true);
    oneSignalInitialized = true;
  } else {
    // Para web
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
      } catch (error) {
        console.error("Error inicializando OneSignal:", error);
      }
    }
>>>>>>> Stashed changes
  }
};

// Obtener el ID del usuario
export const getOneSignalUserId = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    return null;
  } else {
    if (typeof window !== "undefined" && window.OneSignal) {
      return await window.OneSignal.getUserId();
    }
    return null;
  }
};

// Verificar si las notificaciones están habilitadas
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