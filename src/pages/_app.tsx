import { useAdmin } from "@/hooks/useAdmin";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreload } from "@/hooks/usePreload";
import { useUserProfile } from "@/hooks/useUserProfile";
import { LayoutHome } from "@/layouts/layout-home";
import { initializeGoogleAuth } from "@/lib/google-auth-init";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Script from "next/script";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Tipos para OneSignal
interface OneSignal {
  init: (options: any) => Promise<void>;
  showNativePrompt: () => Promise<void>;
  isPushNotificationsEnabled: () => Promise<boolean>;
  getUserId: () => Promise<string | null>;
  on?: (event: string, callback: (data: any) => void) => void;
  addEventListener?: (event: string, callback: (data: any) => void) => void;
  event?: {
    on: (event: string, callback: (data: any) => void) => void;
  };
}

// Tipos para Google API
interface GoogleAuth {
  init: (options: { client_id: string }) => Promise<void>;
  getAuthInstance: () => any;
}

interface Gapi {
  auth2: GoogleAuth;
}

declare global {
  interface Window {
    OneSignal?: OneSignal;
    gapi?: Gapi;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  // Precargar datos críticos en segundo plano
  usePreload();

  // Manejar botón de retroceso de Android
  useAndroidBackButton();

  useEffect(() => {
    initializeGoogleAuth();

    // Inicializar Google Auth correctamente
    const loadGapi = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const check = () => {
            if (
              typeof window !== "undefined" &&
              window.gapi &&
              window.gapi.auth2
            ) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        if (!window.gapi!.auth2.getAuthInstance()) {
          await window.gapi!.auth2.init({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          });
        }
      } catch (err) {
        console.error("❌ Error al inicializar Google Auth:", err);
      }
    };

    loadGapi();
  }, [router]);

  useEffect(() => {
    if (loading || adminLoading || profileLoading) {
      return;
    }

    const isAuthRoute = ["/login", "/reset-password"].includes(router.pathname);

    if (!user && !isAuthRoute) {
      router.push("/login");
      return;
    }

    if (!user) {
      return;
    }

    const onboardingCompleted = profile?.onboarding?.completed === true;
    const isOnboardingRoute = router.pathname.startsWith("/onboarding");
    const isAdminRoute = router.pathname.startsWith("/admin");

    if (router.pathname === "/login") {
      // Esperar a que termine de cargar el admin antes de redirigir
      if (adminLoading) {
        return;
      }

      // Redirigir según el estado del onboarding
      if (!onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }

      return;
    }

    if (
      !onboardingCompleted &&
      !isAdmin &&
      !isOnboardingRoute &&
      !isAdminRoute
    ) {
      router.push("/onboarding");
      return;
    }

    if (onboardingCompleted && isOnboardingRoute) {
      router.push("/home");
    }
  }, [
    user,
    loading,
    adminLoading,
    profileLoading,
    profile,
    isAdmin,
    isMobile,
    router,
  ]);

  // Inicializar OneSignal solo una vez
  useEffect(() => {
    let isInitializing = false;

    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId || appId === "your_onesignal_app_id_here") {
        return;
      }

      // Verificar si ya se está inicializando o ya se inicializó
      if (
        isInitializing ||
        (window as unknown as { OneSignalInitialized: boolean })
          .OneSignalInitialized
      ) {
        return;
      }

      isInitializing = true;

      try {
        // Stub seguro y guard contra doble init
        if (typeof window !== "undefined") {
          (window as any).OneSignal = (window as any).OneSignal || [];
        }

        // Esperar a que el SDK esté disponible
        if (typeof window !== "undefined" && (window as any).OneSignal?.init) {
          await (window as any).OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
          });

          (
            window as unknown as { OneSignalInitialized: boolean }
          ).OneSignalInitialized = true;
        } else {
          isInitializing = false;
          setTimeout(initOneSignal, 500);
          return;
        }
      } catch {
        isInitializing = false;
      }
    };

    if (
      !(window as unknown as { OneSignalInitialized: boolean })
        .OneSignalInitialized
    ) {
      initOneSignal();
    }
  }, []);

  if (
    (!user || (user && router.pathname === "/login")) &&
    ["/login"].includes(router.pathname)
  ) {
    return (
      <>
        {/* Scripts de Google para autenticación */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="https://apis.google.com/js/platform.js"
          strategy="beforeInteractive"
        />
        <Component {...pageProps} />
      </>
    );
  }
  if (router.pathname.startsWith("/admin")) {
    return (
      <>
        {/* Scripts de Google para autenticación */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="https://apis.google.com/js/platform.js"
          strategy="beforeInteractive"
        />
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </>
    );
  }

  if (router.pathname.startsWith("/onboarding")) {
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="https://apis.google.com/js/platform.js"
          strategy="beforeInteractive"
        />
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </>
    );
  }

  return (
    <>
      {/* Scripts de Google para autenticación */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <Script
        src="https://apis.google.com/js/platform.js"
        strategy="beforeInteractive"
      />
      {/* OneSignal SDK se carga en _document.tsx para evitar duplicados */}
      <LayoutHome>
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </LayoutHome>
    </>
  );
}

export default MyApp;
