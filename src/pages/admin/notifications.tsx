import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import TestNotificationButton from "@/components/TestNotificationButton";
import { LayoutAdmin } from "@/layouts/layout-admin";

export default function AdminNotifications() {
  return (
    <LayoutAdmin>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prueba de Notificaciones Push</CardTitle>
          </CardHeader>
          <CardContent>
            <TestNotificationButton />
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
