import CardDiscount from "@/components/cardDiscount/cardDiscount";
import { BackButton } from "@/components/Share/back-button";
import { getImageByCategory } from "@/constants/image-categories";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getDiscounts } from "@/lib/discounts";
import { Discount } from "@/types/discount";
import { getRealDistance } from "@/utils/real-distance";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DiscountDetail() {
  const router = useRouter();
  const { id, distance: urlDistance } = router.query;
  const [discountData, setDiscountData] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string>("Calculando...");
  const [distanceLoading, setDistanceLoading] = useState(true);

  // Hook para obtener la ubicación del usuario
  const { position, getCurrentPosition } = useGeolocation();

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

          // Si tenemos la distancia en la URL, usarla directamente
          if (urlDistance && typeof urlDistance === "string") {
            setDistance(urlDistance);
            setDistanceLoading(false);
          } else if (discount.location) {
            // Si no hay distancia en URL pero el descuento tiene ubicación, calcular
            try {
              await getCurrentPosition();
            } catch (error) {
              console.error("Error obteniendo ubicación:", error);
              setDistance("Ubicación no disponible");
              setDistanceLoading(false);
            }
          } else {
            setDistance("Sin ubicación");
            setDistanceLoading(false);
          }
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

  // Calcular distancia cuando se obtiene la ubicación del usuario (solo si no viene en URL)
  useEffect(() => {
    const calculateDistance = async () => {
      // Si ya tenemos la distancia de la URL, no calcular
      if (urlDistance) return;

      if (!position || !discountData?.location) return;

      try {
        setDistanceLoading(true);

        // 🔍 LOG: Calculando distancia en página de detalle

        const result = await getRealDistance(
          { lat: position.latitude, lng: position.longitude },
          {
            lat: discountData.location.latitude,
            lng: discountData.location.longitude,
          }
        );

        if (result) {
          setDistance(result.distanceText);
        } else {
          setDistance("Error calculando distancia");
        }
      } catch (error) {
        console.error("Error calculando distancia:", error);
        setDistance("Error calculando distancia");
      } finally {
        setDistanceLoading(false);
      }
    };

    calculateDistance();
  }, [position, discountData, urlDistance]);

  return (
    <div className="min-h-screen with-bottom-nav-pb">
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
            availableMemberships={discountData.availableMemberships}
            availableCredentials={discountData.availableCredentials}
            category={discountData.category || "Sin categoría"}
            points={6} // Valor por defecto
            countComments={0} // Valor por defecto
            distance={distanceLoading ? "Calculando..." : distance}
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
