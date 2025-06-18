import "@/styles/globals.css";
import type { AppProps } from 'next/app'; 
import { LayoutHome } from "@/layout/layout-home";  
import { useAuth } from "@/pages/shared/hook/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";

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

  return (
    <LayoutHome>
      <Component {...pageProps} />
    </LayoutHome>
  );
}

export default MyApp;
