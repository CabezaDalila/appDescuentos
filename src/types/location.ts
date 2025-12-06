/**
 * Tipos para el sistema de ubicación y tracking de rutas
 */

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DailyRoute {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  locations: LocationPoint[];
  estimatedDistance: number; // en km
  createdAt: number;
}

export interface RoutesSummary {
  userId: string;
  totalKmLastWeek: number;
  totalKmLastMonth: number;
  averageDailyKm: number;
  mostFrequentDays: number[]; // días de la semana (0-6)
  lastUpdated: number;
}
