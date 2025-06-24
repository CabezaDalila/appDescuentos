import "@/styles/globals.css";
import type { AppProps } from 'next/app'; 
import { LayoutHome } from "@/layout/layout-home";  
import { useAuth } from "@/pages/shared/hook/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  if (!user && router.pathname === "/login") {
    return <Component {...pageProps} />;
  }

  // Si estamos en /profile, no renderizar LayoutHome (barra principal)
  if (router.pathname === "/profile") {
    return <>
      <Component {...pageProps} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>;
  }

  return (
    <LayoutHome>
      <Component {...pageProps} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </LayoutHome>
  );
}

export default MyApp;
