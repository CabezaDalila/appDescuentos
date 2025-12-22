import { ScrapingScriptsManager } from "@/components/admin/scripts/ScrapingScriptsManager";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/Share/card";
import { LayoutAdmin } from "@/layouts/layout-admin";
import { Code } from "lucide-react";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function AdminScripts() {
  return (
    <LayoutAdmin>
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
    </LayoutAdmin>
  );
}
