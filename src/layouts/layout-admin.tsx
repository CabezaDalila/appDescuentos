import { Button } from "@/components/Share/button";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Gift, Home, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

interface LayoutAdminProps {
  children: React.ReactNode;
}

export function LayoutAdmin({ children }: LayoutAdminProps) {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const navigationItems = [
    {
      name: "Panel Principal",
      href: "/admin",
      icon: BarChart3,
      current: router.pathname === "/admin",
    },
    {
      name: "Descuentos",
      href: "/admin/discounts",
      icon: Gift,
      current: router.pathname.startsWith("/admin/discounts"),
    },
    {
      name: "Scripts",
      href: "/admin/scripts",
      icon: Settings,
      current: router.pathname.startsWith("/admin/scripts"),
    },
    {
      name: "Usuarios",
      href: "/admin/users",
      icon: Users,
      current: router.pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <div className="h-screen bg-gray-50 flex admin-layout">
      {/* Sidebar - Solo visible en desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo/Header */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                  >
                    <Icon
                      className={`${
                        item.current
                          ? "text-white"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-3 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info and logout */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar - Solo visible en desktop */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:px-6 lg:py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/home")}
              className="flex items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Ver como Usuario
            </Button>
          </div>
        </div>

        {/* Mobile warning */}
        <div className="lg:hidden bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Panel de Administración:</strong> Este panel está
                optimizado para pantallas de escritorio. Para una mejor
                experiencia, accede desde una computadora.
              </p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 admin-main-content">
          <div className="py-6 admin-content-wrapper">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
