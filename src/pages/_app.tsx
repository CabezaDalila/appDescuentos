import { useAdmin } from "@/hooks/useAdmin";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { useAuth } from "@/hooks/useAuth";
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
  push?: (args: any[]) => void;
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
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);

  usePreload();

  useAndroidBackButton();

  // Scroll al top cuando cambia la ruta
  useEffect(() => {
    const handleRouteChange = () => {
      // Scroll del window
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // También hacer scroll en contenedores internos que puedan tener scroll
      setTimeout(() => {
        const scrollContainers = document.querySelectorAll(
          '[class*="overflow-y-auto"], [class*="overflow-auto"]'
        );
        scrollContainers.forEach((container) => {
          if (container instanceof HTMLElement) {
            container.scrollTop = 0;
          }
        });
      }, 0);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    initializeGoogleAuth();

    // Inicializar Google Auth correctamente
    const loadGapi = async () => {
      try {
        await new Promise<void>((resolve) => {
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
        console.error("Error al inicializar Google Auth:", err);
      }
    };

    loadGapi();
  }, []); // Remover router de dependencias para evitar re-ejecuciones

  useEffect(() => {
    if (loading || adminLoading || profileLoading) {
      return;
    }

    const currentPath = router.pathname;
    const isAuthRoute = ["/login", "/reset-password"].includes(currentPath);

    // Si no hay usuario y no está en ruta de auth, redirigir a login
    if (!user && !isAuthRoute) {
      router.push("/login");
      return;
    }

    // Si no hay usuario, no hacer nada más
    if (!user) {
      return;
    }

    const onboardingCompleted = profile?.onboarding?.completed === true;
    const isOnboardingRoute = currentPath.startsWith("/onboarding");
    const isAdminRoute = currentPath.startsWith("/admin");

    if (currentPath === "/login") {
      if (adminLoading) {
        return;
      }

      // NO redirigir si el email no está verificado - el usuario debe verificar primero
      if (user && !user.emailVerified) {
        return; // Mantener en login para que verifique su email
      }

      // Redirigir según el estado del onboarding solo si el email está verificado
      if (!onboardingCompleted) {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }
      return;
    }

    // Si no completó onboarding y no es admin ni está en onboarding, redirigir
    // PERO solo si el email está verificado
    if (
      !onboardingCompleted &&
      !isAdmin &&
      !isOnboardingRoute &&
      !isAdminRoute &&
      user?.emailVerified // Solo redirigir si el email está verificado
    ) {
      router.push("/onboarding");
      return;
    }

    // Si completó onboarding pero está en onboarding, redirigir a home
    if (onboardingCompleted && isOnboardingRoute) {
      router.push("/home");
      return;
    }
  }, [
    user,
    loading,
    adminLoading,
    profileLoading,
    profile?.onboarding?.completed,
    isAdmin,
    router.pathname,
  ]);

  // Inicializar OneSignal cuando el usuario esté autenticado
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    // Verificar si ya está inicializado
    if (
      (window as unknown as { OneSignalInitialized: boolean })
        ?.OneSignalInitialized
    ) {
      if (user?.uid) {
        const setupListeners = async () => {
          const { setupNotificationListenersForUser } = await import(
            "@/lib/onesignal-config"
          );
          setupNotificationListenersForUser(user.uid);
        };
        setupListeners();
      }
      return;
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || appId === "your_onesignal_app_id_here") {
      return;
    }

    let isInitializing = false;
    let attempts = 0;
    const maxAttempts = 20; // Máximo 10 segundos (20 * 500ms)

    const initOneSignal = async () => {
      attempts++;

      // Verificar límite de intentos
      if (attempts > maxAttempts) {
        console.warn("OneSignal no se cargó después de múltiples intentos");
        return;
      }
      if (
        (window as unknown as { OneSignalInitialized: boolean })
          ?.OneSignalInitialized
      ) {
        if (user?.uid) {
          const { setupNotificationListenersForUser } = await import(
            "@/lib/onesignal-config"
          );
          setupNotificationListenersForUser(user.uid);
        }
        return;
      }

      if (isInitializing) {
        return;
      }

      isInitializing = true;

      try {
        // Stub seguro y guard contra doble init
        if (typeof window !== "undefined") {
          window.OneSignal = window.OneSignal || ({} as OneSignal);
        }

        // Esperar a que el SDK esté disponible
        if (typeof window !== "undefined" && window.OneSignal?.init) {
          await window.OneSignal?.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
          });

          (
            window as unknown as { OneSignalInitialized: boolean }
          ).OneSignalInitialized = true;

          // Configurar listeners para recibir notificaciones
          if (user?.uid) {
            const { setupNotificationListenersForUser } = await import(
              "@/lib/onesignal-config"
            );
            setupNotificationListenersForUser(user.uid);
          }
        } else {
          isInitializing = false;
          // Solo reintentar si no hemos excedido el límite
          if (attempts < maxAttempts) {
            setTimeout(initOneSignal, 500);
          }
          return;
        }
      } catch (error) {
        console.error("Error inicializando OneSignal:", error);
        isInitializing = false;
      }
    };

    initOneSignal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, loading]);

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
