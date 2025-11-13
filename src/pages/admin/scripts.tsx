import { ScrapingScriptsManager } from "@/components/admin/discounts/manager/scripts/ScrapingScriptsManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { LayoutAdmin } from "@/layouts/layout-admin";
import { Code } from "lucide-react";

export default function AdminScripts() {
  return (
    <LayoutAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Scripts de Scraping
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los scripts que extraen descuentos automáticamente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Gestión de Scripts de Scraping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrapingScriptsManager />
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
