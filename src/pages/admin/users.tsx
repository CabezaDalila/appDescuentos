import { UsersManager } from "@/components/admin/UsersManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { LayoutAdmin } from "@/layouts/layout-admin";
import { Users } from "lucide-react";

export default function AdminUsers() {
  return (
    <LayoutAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los usuarios de la plataforma
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Aquí puedes ver, editar y gestionar los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersManager />
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
