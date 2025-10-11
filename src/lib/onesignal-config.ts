import { Capacitor } from '@capacitor/core';

// Configuración de OneSignal
export const ONESIGNAL_CONFIG = {
  APP_ID: 'ab94a58e-b696-4f40-89ef-24597d45fe56',
};

// Inicializar OneSignal según la plataforma
export const initializeOneSignal = async () => {
  if (Capacitor.isNativePlatform()) {
    // Para Android/iOS - Inicialización correcta según las instrucciones
    const OneSignal = (await import('onesignal-cordova-plugin')).default;
    
    // Solo se ejecuta una vez al inicio de la app
    OneSignal.initialize(ONESIGNAL_CONFIG.APP_ID);
    OneSignal.Notifications.requestPermission(true);
  }
};

// Obtener el ID del usuario
export const getOneSignalUserId = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    // Para móvil - OneSignal maneja esto automáticamente
    return null; // Se puede implementar más tarde si es necesario
  } else {
    // Para web
    if (typeof window !== 'undefined' && window.OneSignal) {
      return await window.OneSignal.getUserId();
    }
    return null;
  }
};

// Verificar si las notificaciones están habilitadas
export const isOneSignalEnabled = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    // Para móvil - asumir que está habilitado si OneSignal está configurado
    return true;
  } else {
    // Para web
    if (typeof window !== 'undefined' && window.OneSignal) {
      return await window.OneSignal.isPushNotificationsEnabled();
    }
    return false;
  }
};
