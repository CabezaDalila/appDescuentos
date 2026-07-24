import { Alert, AlertDescription } from "@/components/Share/alert";
import { Badge } from "@/components/Share/badge";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { listAllProfiles, setUserRole } from "@/lib/supabase/profiles";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Mail, Search, Shield, User, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  displayName?: string | null;
  role: "admin" | "user";
  createdAt: string | null;
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const profiles = await listAllProfiles();
      setUsers(
        profiles.map((p) => ({
          id: p.id,
          email: p.email || "Sin email",
          displayName: p.displayName,
          role: p.role,
          createdAt: p.createdAt,
        }))
      );
      setError("");
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        "Error al cargar los usuarios: " +
          (err instanceof Error ? err.message : "desconocido")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await setUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("Error al actualizar el rol del usuario");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName &&
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-4 w-4" />
            <Input
              placeholder="Buscar por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterRole === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterRole === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("admin")}
          >
            Admins
          </Button>
          <Button
            variant={filterRole === "user" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterRole("user")}
          >
            Usuarios
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de usuarios */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p>No se encontraron usuarios</p>
            <p className="text-sm">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Los usuarios aparecerán aquí cuando se registren"}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {user.displayName || "Sin nombre"}
                        </h3>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role === "admin" ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Usuario
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Registrado:{" "}
                        {user.createdAt
                          ? format(new Date(user.createdAt), "dd/MM/yyyy", {
                              locale: es,
                            })
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserRole(user.id, user.role)}
                      className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                    >
                      {user.role === "admin" ? "Quitar Admin" : "Hacer Admin"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Usuarios
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Administradores
                </p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Usuarios Regulares
                </p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "user").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
