/**
 * Tipos e interfaces para el perfil de usuario
 */

export interface UserProfileData {
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  gender: "masculino" | "femenino" | "otro" | null;
  phone?: string | null;
  location?: {
    country: string | null;
    city: string | null;
    timezone: string;
  };
}

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;
  isActive: boolean;
  role?: string;
  profile: UserProfileData;
  preferences?: Record<string, unknown>;
  activity?: Record<string, unknown>;
  onboarding?: Record<string, unknown>;
  privacy?: Record<string, unknown>;
  createdAt?: unknown;
  updatedAt: unknown;
  lastLoginAt?: unknown;
  loginCount?: number;
  [key: string]: unknown;
}

export interface UpdateProfileParams {
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: "masculino" | "femenino" | "otro" | null;
}

