import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import SearchDiscount from "@/components/search/searchDiscount";
import { getHomePageDiscounts } from "@/lib/firebase/discounts";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        setLoading(true);
        const data = await getHomePageDiscounts();
        setDiscounts(data);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, []);

  const handleNavigateToDetail = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  return (
    <div>
      <SearchDiscount />
      <div className="flex flex-wrap gap-8 p-2">
        {loading ? (
          <div className="w-full text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando descuentos...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="w-full text-center py-8">
            <p className="text-gray-600">No hay descuentos disponibles</p>
            <p className="text-sm text-gray-600 mt-2">
              Los descuentos aparecerán aquí cuando se agreguen desde el panel
              de administración
            </p>
          </div>
        ) : (
          discounts.map((discount) => (
            <CardDiscountCompact
              key={discount.id}
              title={discount.title}
              image={discount.image}
              category={discount.category}
              points={discount.points}
              distance={discount.distance}
              expiration={discount.expiration}
              discountPercentage={discount.discountPercentage}
              onNavigateToDetail={() => handleNavigateToDetail(discount.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
