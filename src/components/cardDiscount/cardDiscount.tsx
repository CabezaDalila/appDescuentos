import { CreditCard, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "../Share/badge";
import { Button } from "../Share/button";
import { Separator } from "../Share/separator";

interface CardDiscountProps {
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
}

const CardDiscount: React.FC<CardDiscountProps> = ({
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
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div className="flex justify-start flex-col bg-white rounded-lg p-2 gap-3">
      <div className="flex items-center justify-center h-70 w-full relative">
        {/* Badge de descuento */}
        {discountPercentage && (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="default"
              className="bg-purple-600 text-white text-xs font-bold"
            >
              {discountPercentage}
            </Badge>
          </div>
        )}

        <div className="absolute top-2 right-2 z-10 flex items-center bg-white/70 rounded-full">
          <Button
            variant="ghost"
            className="flex items-center focus:outline-none hover:bg-transparent active:bg-transparent transition-none"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: title,
                  text: description,
                  url: window.location.href,
                });
              } else {
                // Fallback para navegadores que no soportan Web Share API
                navigator.clipboard.writeText(window.location.href);
                alert("¡URL copiada al portapapeles!");
              }
            }}
          >
            <Image src="/share.png" alt="Share" width={16} height={16} />
          </Button>

          <Button
            variant="ghost"
            className="flex items-center focus:outline-none hover:bg-transparent active:bg-transparent transition-none"
            onClick={handleLike}
          >
            <Image
              src={isLiked ? "/loveRed.png" : "/love.png"}
              alt="Like"
              width={16}
              height={16}
            />
          </Button>
        </div>

        <Image
          src={image}
          alt="Card Discount"
          width={100}
          height={100}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{category}</span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <Image src="/star.png" alt="Star" width={10} height={10} />
          {`${points} (${countComments})`}
        </span>
      </div>
      <h1 className="text-sm font-bold text-gray-600">{title}</h1>
      <div className="flex items-center justify-start gap-4">
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <Image src="/distance.png" alt="Distance" width={10} height={10} />
          {distance}
        </span>
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <Image
            src="/expiration.png"
            alt="Expiration"
            width={10}
            height={10}
          />
          {expiration}
        </span>
      </div>
      {/* distancia mas vencimiento */}
      <Separator className="w-full" />
      <p className="text-xs text-gray-600">{description}</p>

      {/* Sección Aplican */}
      <div className="flex flex-col gap-2">
        <h1 className="text-sm font-bold text-gray-600">Aplican</h1>

        {/* Si no tiene requisitos */}
        {(!availableMemberships || availableMemberships.length === 0) &&
          (!availableCredentials || availableCredentials.length === 0) && (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-600 border-gray-300 text-xs w-fit"
            >
              Sin requisitos
            </Badge>
          )}

        {/* Membresías */}
        {availableMemberships && availableMemberships.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">
                Membresías:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableMemberships.map((membership, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                >
                  {membership}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Credenciales */}
        {availableCredentials && availableCredentials.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-violet-600" />
              <span className="text-xs font-medium text-gray-700">
                Credenciales:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableCredentials.map((credential, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-violet-50 text-violet-700 border-violet-200 text-xs"
                >
                  {credential.bank} - {credential.type} {credential.brand}{" "}
                  {credential.level}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDiscount;
