import CardDiscount from "@/components/cardDiscount/cardDiscount";
import { BackButton } from "@/components/Share/back-button";
import { getDiscounts } from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { getImageByCategory } from "@/utils/category-mapping";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DiscountDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [discountData, setDiscountData] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscount = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const allDiscounts = await getDiscounts();
        const discount = allDiscounts.find((d) => d.id === id);

        if (discount) {
          // Usar el mismo sistema de imágenes por categoría
          const image =
            discount.imageUrl || getImageByCategory(discount.category);

          setDiscountData({
            ...discount,
            image: image,
          });
        } else {
          // Si no se encuentra, redirigir a 404 o mostrar error
          router.push("/404");
        }
      } catch (error) {
        console.error("Error cargando descuento:", error);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDiscount();
    }
  }, [id, router]);

  return (
    <div className="min-h-screen">
      {/* Header con botón de regreso */}
      <div>
        <div className="flex items-center p-1">
          <BackButton className="mr-4" />
          <h1 className="text-lg font-semibold text-gray-700">
            Detalle del Descuento
          </h1>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando descuento...</p>
          </div>
        ) : discountData ? (
          <CardDiscount
            title={discountData.title || discountData.name || "Sin título"}
            image={discountData.image || "/primary_image.jpg"}
            description={discountData.description || "Sin descripción"}
            applyWith={discountData.membershipRequired || ["Sin requisitos"]}
            category={discountData.category || "Sin categoría"}
            points={6} // Valor por defecto
            countComments={0} // Valor por defecto
            distance="1.2km" // Valor por defecto
            expiration={
              discountData.validUntil?.toLocaleDateString("es-ES") ||
              "Sin fecha"
            }
            discountPercentage={
              discountData.discountPercentage
                ? `${discountData.discountPercentage}%`
                : "Sin descuento"
            }
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Descuento no encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
