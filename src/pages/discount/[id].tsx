import CardDiscount from "@/components/cardDiscount/cardDiscount";
import { DiscountVote } from "@/components/discount/DiscountVote";
import { BackButton } from "@/components/Share/back-button";
import { GoogleMap } from "@/components/Share/google-map";
import { useDistance } from "@/hooks/useDistance";
import { getDiscounts } from "@/lib/discounts";
import { db } from "@/lib/firebase/firebase";
import { Discount } from "@/types/discount";
import { getImageByCategory } from "@/utils/category-mapping";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DiscountDetail() {
  const router = useRouter();
  const { id, distance: urlDistance } = router.query;
  const [discountData, setDiscountData] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [points, setPoints] = useState(0);

  const { distance, loading: distanceLoading } = useDistance({
    discountLocation: discountData?.location,
    initialDistance: typeof urlDistance === "string" ? urlDistance : undefined,
    enabled: !!discountData?.location,
  });

  useEffect(() => {
    const loadDiscount = async () => {
      if (!router.isReady || !id || typeof id !== "string") {
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);
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

          if (id) {
            const discountRef = doc(db, "discounts", id);
            const discountDoc = await getDoc(discountRef);
            if (discountDoc.exists()) {
              const data = discountDoc.data();
              setPoints(data.points || 0);
            }
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error cargando descuento:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadDiscount();
  }, [id, router.isReady, router]);

  if (!router.isReady) {
    return (
      <div className="min-h-screen with-bottom-nav-pb">
        <div className="flex items-center p-1">
          <BackButton className="mr-4" />
          <h1 className="text-lg font-semibold text-gray-700">
            Detalle del Descuento
          </h1>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando descuento...</p>
          </div>
        </div>
      </div>
    );
  }

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
        ) : notFound ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Descuento no encontrado</p>
          </div>
        ) : discountData ? (
          <>
            <CardDiscount
              id={discountData.id}
              title={discountData.title || discountData.name || "Sin título"}
              image={discountData.image || "/primary_image.jpg"}
              description={discountData.description || "Sin descripción"}
              availableMemberships={discountData.availableMemberships}
              availableCredentials={discountData.availableCredentials}
              category={discountData.category || "Sin categoría"}
              points={points}
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
              renderVote={
                <DiscountVote
                  discountId={discountData.id}
                  currentPoints={points}
                  onPointsUpdate={setPoints}
                />
              }
            />
            {/* Mapa de ubicación */}
            {discountData.location && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  Ubicación
                </h2>
                <GoogleMap
                  latitude={discountData.location.latitude}
                  longitude={discountData.location.longitude}
                  address={discountData.location.address}
                />
                {discountData.location.address && (
                  <p className="text-xs text-gray-600 mt-2">
                    {discountData.location.address}
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
