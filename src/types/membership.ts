import type { Membership } from "@/constants/membership";

// Tipo para elementos que pueden ser membresías o tarjetas individuales
export type MembershipItem = Membership & {
  isCard?: boolean;
  membershipId?: string;
  membershipName?: string;
  membershipCategory?: string;
  card?: {
    type?: string;
    brand?: string;
    level?: string;
    [key: string]: unknown;
  };
};

