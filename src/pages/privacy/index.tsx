import { PageHeader } from "@/components/Share/page-header";
import { ChevronRight, MapPin } from "lucide-react";
import { useRouter } from "next/router";

interface PrivacyItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export default function PrivacyPage() {
  const router = useRouter();

  const privacyItems: PrivacyItem[] = [
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Permiso de ubicación",
      description: "Gestiona el acceso a tu ubicación",
      onClick: () => router.push("/privacy/location"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader
          title="Privacidad y seguridad"
          onBack={() => router.push("/profile")}
        />
      </div>

      {/* Contenido */}
      <div className="px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {privacyItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
