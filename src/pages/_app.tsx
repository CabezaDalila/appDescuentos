import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LayoutHome } from "@/layouts/layout-home";
import { initializeGoogleAuth } from "@/lib/google-auth-init";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  const { user, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    initializeGoogleAuth();

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
