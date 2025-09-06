export interface ScrapingScript {
  id: string;
  siteName: string;
  script: string;
  frequency: "manual" | "hourly" | "daily" | "weekly";
  isActive: boolean;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualDiscount {
  id?: string;
  title: string;
  origin: string;
  category: string;
  expirationDate: Date;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: "admin" | "user";
  permissions: string[];
}
