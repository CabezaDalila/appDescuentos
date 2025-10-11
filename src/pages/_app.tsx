import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LayoutHome } from "@/layouts/layout-home";
import { initializeGoogleAuth } from "@/lib/google-auth-init";
import { initializeOneSignal } from "@/lib/onesignal-config";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Tipos para OneSignal
interface OneSignal {
  init: (options: any) => Promise<void>;
  showNativePrompt: () => Promise<void>;
  isPushNotificationsEnabled: () => Promise<boolean>;
  getUserId: () => Promise<string | null>;
}

declare global {
  interface Window {
    OneSignal?: OneSignal;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    initializeGoogleAuth();
    
    // Inicializar OneSignal para móvil
    initializeOneSignal();

    if (!loading && !user && !["/login"].includes(router.pathname)) {
      router.push("/login");
    }
    if (user && !loading && router.pathname === "/login") {
      if (!isMobile) {
        router.push("/admin");
      } else {
        router.push("/home");
      }
    }
  }, [user, loading, adminLoading, isAdmin, isMobile, router]);

  // Inicializar OneSignal solo una vez
  useEffect(() => {
    let isInitializing = false;
    
    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      
      if (!appId || appId === 'your_onesignal_app_id_here') {
        return;
      }

      // Verificar si ya se está inicializando o ya se inicializó
      if (isInitializing || (window as any).OneSignalInitialized) {
        return;
      }

      isInitializing = true;

      try {
        // Esperar a que OneSignal se cargue
        if (typeof window !== 'undefined' && window.OneSignal) {
          await window.OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true
          });
          
          // Marcar como inicializado
          (window as any).OneSignalInitialized = true;
        } else {
          isInitializing = false;
          // Reintentar después de 500ms
          setTimeout(initOneSignal, 500);
          return;
        }
        
      } catch (error) {
        console.error('❌ Error inicializando OneSignal:', error);
        isInitializing = false;
      }
    };

    // Solo ejecutar si no está inicializado
    if (!(window as any).OneSignalInitialized) {
      initOneSignal();
    }
  }, []);

  if (
    (!user || (user && router.pathname === "/login")) &&
    ["/login"].includes(router.pathname)
  ) {
    return (
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }
  if (router.pathname.startsWith("/admin")) {
    return (
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
        </Head>
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </>
    );
  }

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <LayoutHome>
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </LayoutHome>
    </>
  );
}

export default MyApp;
