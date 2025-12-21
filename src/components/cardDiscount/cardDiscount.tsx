import { useAuth } from "@/hooks/useAuth";
import { isLocationPermissionEnabled } from "@/hooks/useGeolocation";
import {
    getUserInteraction,
    toggleFavorite as toggleFavoriteInteraction,
} from "@/lib/firebase/interactions";
import { CreditCard, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "../Share/badge";

interface CardDiscountProps {
  id?: string;
  title: string;
  image: string;
  description: string;
  availableMemberships?: string[];
  availableCredentials?: Array<{
    bank: string;
    type: string;
    brand: string;
    level: string;
  }>;
  category: string;
  points: number;
  countComments: number;
  distance: string;
  expiration: string;
  discountPercentage: string;
  discountAmount?: number;
  renderVote?: React.ReactNode;
}

const CardDiscount: React.FC<CardDiscountProps> = ({
  id,
  title,
  image,
  description,
  availableMemberships,
  availableCredentials,
  category,
  points,
  countComments,
  distance,
  expiration,
  discountPercentage,
  discountAmount,
  renderVote,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadFavorite = async () => {
      if (!user || !id) {
        setIsLiked(false);
        return;
      }

      try {
        const interaction = await getUserInteraction(user.uid, id);
        setIsLiked(!!interaction?.favorite);
      } catch (error) {
        console.error("Error cargando favorito del descuento:", error);
        setIsLiked(false);
      }
    };

    loadFavorite();
  }, [user, id]);

  const handleLike = async () => {
    if (!id) {
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para guardar favoritos");
      return;
    }

    try {
      const nowLiked = await toggleFavoriteInteraction(user.uid, id);
      setIsLiked(nowLiked);
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      toast.error("No se pudo guardar tu favorito. Intenta nuevamente.");
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Imagen con overlay y badges */}
      <div className="relative h-52 sm:h-64 w-full">
        <Image
          src={image}
          alt="Card Discount"
          fill
          className="object-cover"
          priority={false}
        />
        
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Badge de descuento */}
        {discountPercentage && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-bold px-3 py-1 shadow-lg">
              {discountPercentage}
            </Badge>
          </div>
        )}

        {/* Botón de favorito */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleLike}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <Image
              src={isLiked ? "/loveRed.png" : "/love.png"}
              alt="Like"
              width={18}
              height={18}
            />
          </button>
        </div>

        {/* Categoría y puntos en la imagen */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {category}
          </span>
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Image src="/star.png" alt="Star" width={12} height={12} />
            {points}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Título */}
        <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
        
        {/* Info: distancia, fecha y votos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLocationPermissionEnabled() && distance && distance !== "" && (
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                  <Image src="/distance.png" alt="Distance" width={12} height={12} />
                </span>
                {distance}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <Image src="/expiration.png" alt="Expiration" width={12} height={12} />
              </span>
              {expiration}
            </span>
          </div>
          {renderVote && (
            <div className="flex items-center">{renderVote}</div>
          )}
        </div>

        {/* Descripción */}
        {description && (
          <div className="bg-gray-50 p-3 rounded-xl space-y-2">
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
            {/* Tope de reintegro - integrado de forma sutil */}
            {discountAmount && discountAmount > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Tope de reintegro:{" "}
                  <span className="text-gray-700 font-medium">
                    ${discountAmount.toLocaleString("es-AR")}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sección Aplican */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            Aplican
          </h2>

          {/* Si no tiene requisitos */}
          {(!availableMemberships || availableMemberships.length === 0) &&
            (!availableCredentials || availableCredentials.length === 0) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-sm text-green-700 font-medium">
                  ✓ Sin requisitos especiales
                </span>
              </div>
            )}

          {/* Membresías */}
          {availableMemberships && availableMemberships.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Membresías:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableMemberships.map((membership, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-white text-blue-700 border-blue-200 text-xs font-medium"
                  >
                    {membership}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Credenciales */}
          {availableCredentials && availableCredentials.length > 0 && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-900">
                  Credenciales:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCredentials.map((credential, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-white text-violet-700 border-violet-200 text-xs font-medium"
                  >
                    {credential.bank} - {credential.type} {credential.brand} {credential.level}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDiscount;
