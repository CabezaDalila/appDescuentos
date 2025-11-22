import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { db } from "@/lib/firebase/firebase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { collection, getDocs } from "firebase/firestore";
import {
  Activity,
  Calendar,
  Database,
  Eye,
  Gift,
  Heart,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  totalDiscounts: number;
  totalScripts: number;
  activeDiscounts: number;
  recentUsers: number;
  recentDiscounts: number;
  inactiveDiscounts: number;
  expiredDiscounts: number;
  manualDiscounts: number;
  scrapedDiscounts: number;
  pendingDiscounts: number;
  approvedDiscounts: number;
  rejectedDiscounts: number;
}

interface RecentActivity {
  id: string;
  type: "user" | "discount" | "script";
  title: string;
  date: Date;
  description: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDiscounts: 0,
    totalScripts: 0,
    activeDiscounts: 0,
    recentUsers: 0,
    recentDiscounts: 0,
    inactiveDiscounts: 0,
    expiredDiscounts: 0,
    manualDiscounts: 0,
    scrapedDiscounts: 0,
    pendingDiscounts: 0,
    approvedDiscounts: 0,
    rejectedDiscounts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener estadísticas de usuarios
        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;

        // Usuarios recientes (últimos 7 días)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentUsers = usersSnapshot.docs.filter((doc) => {
          const userData = doc.data();
          const createdAt =
            userData.createdAt?.toDate?.() || new Date(userData.createdAt);
          return createdAt >= weekAgo;
        }).length;

        // Obtener estadísticas de descuentos
        const discountsSnapshot = await getDocs(collection(db, "discounts"));
        const totalDiscounts = discountsSnapshot.size;

        // Analizar descuentos por estado
        const activeDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.status === "active" || !data.status;
        }).length;

        const inactiveDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.status === "inactive";
        }).length;

        // Descuentos expirados (fecha de expiración pasada)
        const now = new Date();
        const expiredDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          const expirationDate =
            data.expirationDate?.toDate?.() || data.validUntil?.toDate?.();
          return expirationDate && expirationDate < now;
        }).length;

        // Descuentos por tipo
        const manualDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.type === "manual" || !data.type;
        }).length;

        const scrapedDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.type === "scraped";
        }).length;

        // Descuentos recientes (últimos 7 días)
        const recentDiscounts = discountsSnapshot.docs.filter((doc) => {
          const data = doc.data();
          const createdAt =
            data.createdAt?.toDate?.() || new Date(data.createdAt);
          return createdAt >= weekAgo;
        }).length;

        // Obtener estadísticas de scripts
        const scriptsSnapshot = await getDocs(
          collection(db, "scrapingScripts")
        );
        const totalScripts = scriptsSnapshot.size;

        setStats({
          totalUsers,
          totalDiscounts,
          totalScripts,
          activeDiscounts,
          recentUsers,
          recentDiscounts,
          inactiveDiscounts,
          expiredDiscounts,
          manualDiscounts,
          scrapedDiscounts,
          pendingDiscounts: 0,
          approvedDiscounts: activeDiscounts, // Aproximación: descuentos activos = aprobados
          rejectedDiscounts: 0,
        });

        // Crear actividad reciente
        const activity: RecentActivity[] = [];

        // Agregar usuarios recientes
        usersSnapshot.docs
          .filter((doc) => {
            const userData = doc.data();
            const createdAt =
              userData.createdAt?.toDate?.() || new Date(userData.createdAt);
            return createdAt >= weekAgo;
          })
          .slice(0, 3)
          .forEach((doc) => {
            const userData = doc.data();
            activity.push({
              id: doc.id,
              type: "user",
              title: userData.displayName || userData.email,
              date:
                userData.createdAt?.toDate?.() || new Date(userData.createdAt),
              description: "Nuevo usuario registrado",
            });
          });

        // Agregar descuentos recientes
        discountsSnapshot.docs
          .filter((doc) => {
            const data = doc.data();
            const createdAt =
              data.createdAt?.toDate?.() || new Date(data.createdAt);
            return createdAt >= weekAgo;
          })
          .slice(0, 3)
          .forEach((doc) => {
            const data = doc.data();
            activity.push({
              id: doc.id,
              type: "discount",
              title: data.title || data.name || "Descuento sin título",
              date: data.createdAt?.toDate?.() || new Date(data.createdAt),
              description: `Descuento en ${data.category || "Sin categoría"}`,
            });
          });

        // Ordenar por fecha y tomar los 5 más recientes
        activity.sort((a, b) => b.date.getTime() - a.date.getTime());
        setRecentActivity(activity.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentUsers} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Descuentos Activos
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDiscounts}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalDiscounts} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scripts de Scraping
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScripts}</div>
            <p className="text-xs text-muted-foreground">
              Scripts configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Descuentos Manuales
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manualDiscounts}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalDiscounts} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de estado de descuentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Descuentos Inactivos
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveDiscounts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (stats.inactiveDiscounts / Math.max(stats.totalDiscounts, 1)) *
                  100
              )}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Descuentos Expirados
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiredDiscounts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (stats.expiredDiscounts / Math.max(stats.totalDiscounts, 1)) *
                  100
              )}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Descuentos Scrapeados
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scrapedDiscounts}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (stats.scrapedDiscounts / Math.max(stats.totalDiscounts, 1)) *
                  100
              )}
              % del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {item.type === "user" && (
                      <Users className="h-4 w-4 text-blue-500" />
                    )}
                    {item.type === "discount" && (
                      <Gift className="h-4 w-4 text-green-500" />
                    )}
                    {item.type === "script" && (
                      <Activity className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-600">
                    {format(item.date, "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              No hay actividad reciente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
