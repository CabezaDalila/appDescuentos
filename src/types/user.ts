export type Language = 'es' | 'en';

export interface UserPreferences {
  language: Language;
  region: string;
  useLocation: boolean;
} 