/**
 * Servicio de geolocalización con Capacitor
 */

import type { LocationPoint } from "@/types/location";
import { Geolocation } from "@capacitor/geolocation";

/**
 * Solicitar permisos de ubicación
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === "granted";
  } catch (error) {
    console.error("Error solicitando permisos de ubicación:", error);
    return false;
  }
}

/**
 * Verificar si tenemos permisos de ubicación
 */
export async function checkLocationPermissions(): Promise<boolean> {
  try {
    const permission = await Geolocation.checkPermissions();
    return permission.location === "granted";
  } catch (error) {
    console.error("Error verificando permisos:", error);
    return false;
  }
}

/**
 * Obtener ubicación actual
 */
export async function getCurrentLocation(): Promise<LocationPoint | null> {
  try {
    const hasPermission = await checkLocationPermissions();
    
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        throw new Error("Permisos de ubicación denegados");
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error("Error obteniendo ubicación:", error);
    return null;
  }
}