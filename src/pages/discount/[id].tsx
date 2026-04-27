import CardDiscount from "@/components/cardDiscount/cardDiscount";
import { DiscountVote } from "@/components/discount/DiscountVote";
import { BackButton } from "@/components/Share/back-button";
import { GoogleMap } from "@/components/Share/google-map";
import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
} from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { useDistance } from "@/hooks/useDistance";
import { getDiscounts } from "@/lib/discounts";
import { db } from "@/lib/firebase/firebase";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import { Discount } from "@/types/discount";
import { getImageByCategory } from "@/utils/category-mapping";
import { isUserEligibleForDiscountRestrictions } from "@/utils/membership-match";
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
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [userCredentials, setUserCredentials] = useState<
    Array<{
      bank: string;
      type: Card["type"];
      brand: Card["brand"];
      level: (typeof CARD_LEVELS)[number]["value"];
    }>
  >([]);
  const [restrictionsReady, setRestrictionsReady] = useState(false);
  const { user } = useAuth();

  const { distance, loading: distanceLoading } = useDistance({
    discountLocation: discountData?.location,
    initialDistance: typeof urlDistance === "string" ? urlDistance : undefined,
    enabled: !!discountData?.location,
  });

  useEffect(() => {
    const loadRestrictions = async () => {
      if (!user) {
        setUserMemberships([]);
        setUserCredentials([]);
        setRestrictionsReady(true);
        return;
      }
      try {
        const memberships = await getActiveMemberships();
        const membershipNames: string[] = [];
        const credentials: Array<{
          bank: string;
          type: Card["type"];
          brand: Card["brand"];
          level: (typeof CARD_LEVELS)[number]["value"];
        }> = [];

        const validTypes = CARD_TYPES.map((t) => t.value) as ReadonlyArray<
          Card["type"]
        >;
        const validBrands = CARD_BRANDS.map((b) => b.value) as ReadonlyArray<
          Card["brand"]
        >;
        const validLevels = CARD_LEVELS.map((l) => l.value) as ReadonlyArray<
          (typeof CARD_LEVELS)[number]["value"]
        >;

        const isValidType = (v: unknown): v is Card["type"] =>
          typeof v === "string" &&
          (validTypes as readonly string[]).includes(v);
        const isValidBrand = (v: unknown): v is Card["brand"] =>
          typeof v === "string" &&
          (validBrands as readonly string[]).includes(v);
        const isValidLevel = (
          v: unknown
        ): v is (typeof CARD_LEVELS)[number]["value"] =>
          typeof v === "string" &&
          (validLevels as readonly string[]).includes(v);

        memberships.forEach((m: unknown) => {
          const item = m as {
            name?: string;
            membershipName?: string;
            membershipCategory?: string;
            isCard?: boolean;
            card?: { type?: string; brand?: string; level?: string };
            cards?: Card[];
          };
          const name = item.name || item.membershipName;
          if (typeof name === "string" && name.trim().length > 0) {
            membershipNames.push(name);
          }

          if (item.isCard && item.membershipCategory === "banco" && item.card) {
            const bank = typeof name === "string" ? name : "";
            const type = isValidType(item.card.type)
              ? item.card.type
              : undefined;
            const brand = isValidBrand(item.card.brand)
              ? item.card.brand
              : undefined;
            const level = isValidLevel(item.card.level)
              ? item.card.level
              : undefined;
            if (bank && type && brand && level) {
              credentials.push({ bank, type, brand, level });
            }
          } else if (Array.isArray(item.cards) && item.cards.length > 0) {
            (item.cards as Card[]).forEach((card) => {
              const bank = typeof name === "string" ? name : "";
              const type = isValidType(card.type) ? card.type : undefined;
              const brand = isValidBrand(card.brand) ? card.brand : undefined;
              const level = isValidLevel(card.level) ? card.level : undefined;
              if (bank && type && brand && level) {
                credentials.push({ bank, type, brand, level });
              }
            });
          }
        });

        setUserMemberships(
          Array.from(
            new Set(
              membershipNames.filter(
                (n) => typeof n === "string" && n.trim().length > 0
              )
            )
          )
        );
        setUserCredentials(credentials);
      } finally {
        setRestrictionsReady(true);
      }
    };
    loadRestrictions();
  }, [user]);

  useEffect(() => {
    const loadDiscount = async () => {
      if (
        !router.isReady ||
        !id ||
        typeof id !== "string" ||
        !restrictionsReady
      ) {
        return;
      }

      try {
        setLoading(true);
        setNotFound(false);
        const allDiscounts = await getDiscounts();
        const discount = allDiscounts.find((d) => d.id === id);

        if (discount) {
          const isEligible = isUserEligibleForDiscountRestrictions(
            userMemberships,
            userCredentials,
            discount,
            { requireRestrictions: true, strictPriority: true }
          );
          if (!isEligible) {
            setNotFound(true);
            return;
          }

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
  }, [id, router.isReady, router, restrictionsReady, userMemberships, userCredentials]);

  if (!router.isReady) {
    return (
      <div className="min-h-screen with-bottom-nav-pb">
        <div className="flex items-center px-3 py-4">
          <BackButton className="mr-3" />
          <h1 className="text-lg font-semibold text-gray-700 leading-none">
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
        <div className="flex items-center px-3 py-4">
          <BackButton className="mr-3" />
          <h1 className="text-lg font-semibold text-gray-700 leading-none">
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
                discountData.expirationDate?.toLocaleDateString("es-ES") ||
                "Sin fecha"
              }
              discountPercentage={
                discountData.discountPercentage
                  ? `${discountData.discountPercentage}%`
                  : "Sin descuento"
              }
              discountAmount={discountData.discountAmount}
              terms={discountData.terms}
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
