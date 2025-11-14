import { UsersManager } from "@/components/admin/users/UsersManager";
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
    </LayoutAdmin>
  );
}
