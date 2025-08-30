import { Bell, Search, Filter, SortAsc, ArrowLeft, Check, Percent, Calendar, CreditCard, MoreVertical, Trash2 } from "lucide-react"
import { Input } from "@/components/Share/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Share/select"
import { Card, CardContent } from "@/components/Share/card"
import { useState } from "react"
import { useRouter } from "next/router"

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  read: boolean
  category: string
  icon: string
}

export default function Notifications() {
  const router = useRouter()
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    unreadOnly: boolean;
    category: string;
  }>({
    unreadOnly: false,
    category: "all"
  })
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "promotions">("all")
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Promoción por vencer",
      message: "Tu promoción de 2x1 en cines vence en 2 días",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
      read: false,
      category: "promociones",
      icon: "calendar"
    },
    {
      id: "2",
      title: "Nueva cuenta añadida",
      message: "Tu cuenta de Banco Santander ha sido añadida exitosamente",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
      read: false,
      category: "cuenta",
      icon: "creditcard"
    },
    {
      id: "3",
      title: "Nueva promoción disponible",
      message: "25% de descuento en tiendas de ropa con Club La Nación",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
      read: true,
      category: "ofertas",
      icon: "percent"
    },
    {
      id: "4",
      title: "Descuento aplicado",
      message: "Se ha aplicado un descuento del 15% en tu próxima compra",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 días atrás
      read: true,
      category: "ofertas",
      icon: "percent"
    },
    {
      id: "5",
      title: "Recordatorio de vencimiento",
      message: "Tu membresía de Galeno vence en 7 días",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 días atrás
      read: false,
      category: "recordatorios",
      icon: "calendar"
    },
    {
      id: "6",
      title: "Nueva promoción de Banco Galicia",
      message: "50% de descuento en restaurantes seleccionados",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 días atrás
      read: true,
      category: "promociones",
      icon: "percent"
    },
    {
      id: "7",
      title: "Cuenta verificada",
      message: "Tu cuenta de Banco Macro ha sido verificada exitosamente",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 días atrás
      read: true,
      category: "cuenta",
      icon: "creditcard"
    },
    {
      id: "8",
      title: "Promoción especial",
      message: "3x2 en todas las entradas de cine este fin de semana",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 días atrás
      read: false,
      category: "promociones",
      icon: "calendar"
    },
    {
      id: "9",
      title: "Actualización del sistema",
      message: "Se han aplicado mejoras en la seguridad de tu cuenta",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 días atrás
      read: true,
      category: "sistema",
      icon: "bell"
    },
    {
      id: "10",
      title: "Oferta limitada",
      message: "30% de descuento en supermercados hasta mañana",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 días atrás
      read: false,
      category: "ofertas",
      icon: "percent"
    },
    {
      id: "11",
      title: "Nueva tarjeta disponible",
      message: "Tu tarjeta de crédito está lista para retirar",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 días atrás
      read: true,
      category: "cuenta",
      icon: "creditcard"
    },
    {
      id: "12",
      title: "Promoción por tiempo limitado",
      message: "2x1 en todas las pizzas de las mejores pizzerías",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 días atrás
      read: true,
      category: "promociones",
      icon: "calendar"
    },
    {
      id: "13",
      title: "Mantenimiento programado",
      message: "El sistema estará en mantenimiento mañana de 2:00 a 4:00 AM",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11), // 11 días atrás
      read: false,
      category: "sistema",
      icon: "bell"
    },
    {
      id: "14",
      title: "Descuento en farmacias",
      message: "20% de descuento en medicamentos con receta",
      type: "info",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 días atrás
      read: true,
      category: "ofertas",
      icon: "percent"
    },
    {
      id: "15",
      title: "Cuenta bloqueada temporalmente",
      message: "Tu cuenta ha sido bloqueada por seguridad. Contacta soporte",
      type: "error",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13), // 13 días atrás
      read: false,
      category: "cuenta",
      icon: "creditcard"
    }
  ])

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    )
  }

  const handleFilterChange = (filterType: 'unreadOnly' | 'category', value: string | boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setActiveFilters({
      unreadOnly: false,
      category: "all"
    })
  }

  // Filtrar notificaciones según los filtros activos
  const filteredNotifications = notifications.filter(notification => {
    // Filtro por no leídas
    if (activeFilters.unreadOnly && notification.read) {
      return false
    }
    
    // Filtro por categoría
    if (activeFilters.category !== "all") {
      if (activeFilters.category === "offers" && notification.category !== "ofertas") {
        return false
      }
      if (activeFilters.category === "account" && notification.category !== "cuenta") {
        return false
      }
      if (activeFilters.category === "expiring" && !(notification.category === "promociones" && notification.title.toLowerCase().includes("vencer"))) {
        return false
      }
      if (activeFilters.category === "system" && notification.category !== "sistema") {
        return false
      }
    }
    
    return true
  })

  const getNotificationIcon = (icon: string) => {
    switch (icon) {
      case 'percent':
        return <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Percent className="h-4 w-4 text-green-600" /></div>
      case 'calendar':
        return <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><Calendar className="h-4 w-4 text-orange-600" /></div>
      case 'creditcard':
        return <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><CreditCard className="h-4 w-4 text-blue-600" /></div>
      default:
        return <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Bell className="h-4 w-4 text-purple-600" /></div>
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`
    }
  }

  const formatTimeDisplay = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    if (diffInDays === 0) {
      return `${hours}:${minutes} • Hoy`
    } else if (diffInDays === 1) {
      return `${hours}:${minutes} • Ayer`
    } else {
      return `${hours}:${minutes} • ${diffInDays}d`
    }
  }

  const getTimeSection = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return "HOY"
    } else if (diffInDays === 1) {
      return "AYER"
    } else if (diffInDays <= 7) {
      return "ESTA SEMANA"
    } else {
      return "ANTERIOR"
    }
  }

  const groupNotificationsByTime = () => {
    const groups: { [key: string]: Notification[] } = {}
    
    filteredNotifications.forEach(notification => {
      const section = getTimeSection(notification.timestamp)
      if (!groups[section]) {
        groups[section] = []
      }
      groups[section].push(notification)
    })
    
    return groups
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const filterOptions = [
    { id: "unreadOnly", label: "Solo no leídas", icon: null },
    { id: "all", label: "Todas las categorías", icon: null },
    { id: "offers", label: "Ofertas", icon: "percent", color: "green" },
    { id: "account", label: "Cuenta", icon: "creditcard", color: "blue" },
    { id: "expiring", label: "Por vencer", icon: "calendar", color: "orange" },
    { id: "system", label: "Sistema", icon: "bell", color: "purple" }
  ]

  const getFilterDescription = () => {
    const filters = []
    if (activeFilters.unreadOnly) filters.push("Solo no leídas")
    if (activeFilters.category !== "all") {
      const categoryLabels = {
        "offers": "Ofertas",
        "account": "Cuenta", 
        "expiring": "Por vencer",
        "system": "Sistema"
      }
      filters.push(categoryLabels[activeFilters.category as keyof typeof categoryLabels])
    }
    return filters.length > 0 ? filters.join(" + ") : "Todas las categorías"
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header principal */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        {/* Header con botón de retroceso, título y filtros */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="flex-1 ml-3">
            <h1 className="text-lg font-bold text-gray-900">Notificaciones</h1>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} nueva${unreadCount > 1 ? 's' : ''}` : 'Todo al día'}
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

        {/* Dropdown de filtros */}
        {showFilterDropdown && (
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-48">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === "unreadOnly") {
                    handleFilterChange("unreadOnly", !activeFilters.unreadOnly)
                  } else if (option.id === "all") {
                    handleFilterChange("category", "all")
                  } else {
                    handleFilterChange("category", option.id)
                  }
                  setShowFilterDropdown(false)
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
                ) : option.id === "system" ? (
                  activeFilters.category === "system" ? (
                    <Check className="h-4 w-4 text-black" />
                  ) : (
                    <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                      <Bell className="h-3 w-3 text-purple-600" />
                    </div>
                  )
                ) : (
                  <div className="w-4 h-4"></div>
                )}
                <span className="text-sm text-gray-900">{option.label}</span>
              </button>
            ))}
            {activeFilters.unreadOnly || activeFilters.category !== "all" ? (
              <button
                onClick={clearFilters}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left text-red-600"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">Limpiar filtros</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-2xl pb-20">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-sm text-gray-500 mb-4">
                No se encontraron notificaciones con los filtros seleccionados
              </p>
              {(activeFilters.unreadOnly || activeFilters.category !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupNotificationsByTime()).map(([section, sectionNotifications]) => (
              <div key={section} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-gray-500">{section}</h2>
                  <span className="text-sm text-gray-400">{sectionNotifications.length}</span>
                </div>
                <div className="space-y-3">
                  {sectionNotifications.map((notification) => (
                    <Card key={notification.id} className="cursor-pointer transition-all hover:shadow-md bg-white relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.icon)}
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
                              <span className="text-xs text-gray-400">
                                {formatTimeDisplay(notification.timestamp)}
                              </span>
                              <button 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="text-xs">Eliminar</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}