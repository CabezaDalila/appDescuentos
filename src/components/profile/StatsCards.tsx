import { Card, CardContent } from "@/components/Share/card";
import { Gift, TrendingUp, Heart, Star } from "lucide-react";

interface StatCard {
  icon: React.ReactNode;
  value: string;
  label: string;
  bgColor: string;
  iconColor: string;
}

const stats: StatCard[] = [
  {
    icon: <Gift className="h-5 w-5" />,
    value: "24",
    label: "Ofertas usadas",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    value: "$1,250",
    label: "Ahorros totales",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: <Heart className="h-5 w-5" />,
    value: "12",
    label: "Favoritos",
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    icon: <Star className="h-5 w-5" />,
    value: "850",
    label: "Puntos",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <div className={stat.iconColor}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
