import { ManualDiscountsManager } from "@/components/admin/scripts/ManualDiscountsManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { LayoutAdmin } from "@/layouts/layout-admin";
import { Gift } from "lucide-react";

export default function AdminDiscounts() {
  return (
    <LayoutAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Descuentos</h1>
          <p className="text-gray-600 mt-2">
            Gestiona los descuentos de la plataforma
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Crea, edita y elimina descuentos de forma manual para ofrecer
              promociones especiales.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ManualDiscountsManager />
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
