import "@/styles/globals.css";
import type { AppProps } from 'next/app'; 
import { LayoutHome } from "@/layouts/layout-home";  
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { initializeGoogleAuth } from "@/lib/google-auth-init";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Inicializar Google Auth para Capacitor
    initializeGoogleAuth();
    
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  if (!user && router.pathname === "/login") {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <LayoutHome>
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </LayoutHome>
    </>
  );
}

export default MyApp;
