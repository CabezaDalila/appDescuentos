import { Card, CardContent } from "@/components/Share/card";
import { Notification, useNotifications } from "@/hooks/useNotifications";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CreditCard,
  Filter,
  Percent,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Notifications() {
  const router = useRouter();
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    getUnreadCount,
  } = useNotifications();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    unreadOnly: boolean;
    category: string;
  }>({
    unreadOnly: false,
    category: "all",
  });

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleFilterChange = (
    filterType: "unreadOnly" | "category",
    value: string | boolean
  ) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      unreadOnly: false,
      category: "all",
    });
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilters.unreadOnly && notification.read) {
      return false;
    }

    if (activeFilters.category !== "all") {
      if (
        activeFilters.category === "offers" &&
        notification.type !== "promocion"
      ) {
        return false;
      }
      if (
        activeFilters.category === "account" &&
        notification.type !== "sistema"
      ) {
        return false;
      }
      if (
        activeFilters.category === "expiring" &&
        notification.type !== "vencimiento_tarjeta"
      ) {
        return false;
      }
      if (
        activeFilters.category === "reminders" &&
        notification.type !== "recordatorio"
      ) {
        return false;
      }
    }

    return true;
  });

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case "vencimiento_tarjeta":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        );
      case "promocion":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Percent className="h-4 w-4 text-green-600" />
          </div>
        );
      case "recordatorio":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
        );
      case "sistema":
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
        );
      case "success":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        );
      case "warning":
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
        );
      case "error":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Bell className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  };

  const formatTimeDisplay = (date: Date) => {
    if (!date) return "Fecha no disponible";

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (diffInDays === 0) {
      return `${hours}:${minutes} • Hoy`;
    } else if (diffInDays === 1) {
      return `${hours}:${minutes} • Ayer`;
    } else {
      return `${hours}:${minutes} • ${diffInDays}d`;
    }
  };

  const getTimeSection = (date: Date) => {
    if (!date) return "ANTERIOR";

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return "HOY";
    } else if (diffInDays === 1) {
      return "AYER";
    } else if (diffInDays <= 7) {
      return "ESTA SEMANA";
    } else {
      return "ANTERIOR";
    }
  };

  const groupNotificationsByTime = () => {
    const groups: { [key: string]: Notification[] } = {};

    filteredNotifications.forEach((notification) => {
      const section = getTimeSection(notification.timestamp);
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(notification);
    });

    return groups;
  };

  const unreadCount = getUnreadCount();

  const filterOptions = [
    { id: "unreadOnly", label: "Solo no leídas", icon: null },
    { id: "all", label: "Todas las categorías", icon: null },
    { id: "offers", label: "Ofertas", icon: "percent", color: "green" },
    { id: "account", label: "Cuenta", icon: "creditcard", color: "blue" },
    { id: "expiring", label: "Por vencer", icon: "calendar", color: "orange" },
    { id: "reminders", label: "Recordatorios", icon: "bell", color: "blue" },
  ];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 relative">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex-1 ml-3">
            <h1 className="text-lg font-bold text-gray-900">Notificaciones</h1>
            <p className="text-xs text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} nueva${unreadCount > 1 ? "s" : ""}`
                : "Todo al día"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtrar</span>
            </button>
          </div>
        </div>

        {showFilterDropdown && (
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-48">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === "unreadOnly") {
                    handleFilterChange("unreadOnly", !activeFilters.unreadOnly);
                  } else if (option.id === "all") {
                    handleFilterChange("category", "all");
                  } else {
                    handleFilterChange("category", option.id);
                  }
                  setShowFilterDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {option.id === "unreadOnly" ? (
                  activeFilters.unreadOnly ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                      <Bell className="h-3 w-3 text-red-600" />
                    </div>
                  )
                ) : option.id === "all" ? (
                  activeFilters.category === "all" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                      <Filter className="h-3 w-3 text-gray-600" />
                    </div>
                  )
                ) : option.id === "offers" ? (
                  activeFilters.category === "offers" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                      <Percent className="h-3 w-3 text-green-600" />
                    </div>
                  )
                ) : option.id === "account" ? (
                  activeFilters.category === "account" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-blue-600" />
                    </div>
                  )
                ) : option.id === "expiring" ? (
                  activeFilters.category === "expiring" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-orange-600" />
                    </div>
                  )
                ) : option.id === "reminders" ? (
                  activeFilters.category === "reminders" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                      <Bell className="h-3 w-3 text-blue-600" />
                    </div>
                  )
                ) : (
                  <div className="w-4 h-4"></div>
                )}
                <span className="text-sm text-gray-900">{option.label}</span>
              </button>
            ))}
            {(activeFilters.unreadOnly || activeFilters.category !== "all") && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-red-600"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Limpiar filtros</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-2xl pb-20">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cargando notificaciones...
              </h3>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error al cargar notificaciones
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                No se encontraron notificaciones con los filtros seleccionados
              </p>
              {(activeFilters.unreadOnly ||
                activeFilters.category !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupNotificationsByTime()).map(
              ([section, sectionNotifications]) => (
                <div key={section} className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-gray-600">
                      {section}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {sectionNotifications.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sectionNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="cursor-pointer transition-all hover:shadow-md bg-white relative"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-sm text-gray-900">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-violet-500 rounded-full ml-2 flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-600">
                                  {formatTimeDisplay(notification.timestamp)}
                                </span>
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <button
                                      onClick={() =>
                                        handleMarkAsRead(notification.id)
                                      }
                                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span className="text-xs">
                                        Marcar leída
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleDeleteNotification(notification.id)
                                    }
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="text-xs">Eliminar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
