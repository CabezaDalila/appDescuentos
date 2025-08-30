import Image from "next/image";
import { useState } from "react";
import { Badge } from "../Share/badge";
import { Button } from "../Share/button";

interface CardDiscountCompactProps {
  title: string;
  image: string;
  category: string;
  points: number;
  distance: string;
  expiration: string;
  discountPercentage: string;
  onClick?: () => void;
  onNavigateToDetail?: () => void;
}

const CardDiscountCompact: React.FC<CardDiscountCompactProps> = ({
  title,
  image,
  category,
  points,
  distance,
  expiration,
  discountPercentage,
  onClick,
  onNavigateToDetail,
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleCardClick = () => {
    if (onNavigateToDetail) {
      onNavigateToDetail();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className="flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer m-2"
      onClick={handleCardClick}
    >
      <div className="relative h-32 w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-t-lg"
        />

        {/* Badge de descuento */}
        {discountPercentage && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="default"
              className="bg-purple-600 text-white text-xs font-bold"
            >
              {discountPercentage}
            </Badge>
          </div>
        )}

        {/* Botón de like */}
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white/70 hover:bg-white rounded-full"
            onClick={handleLike}
          >
            <Image
              src={isLiked ? "/loveRed.png" : "/love.png"}
              alt="Like"
              width={14}
              height={14}
            />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-3 space-y-2">
        {/* Categoría y rating */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{category}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Image src="/star.png" alt="Star" width={10} height={10} />
            {points}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Información adicional */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Image src="/distance.png" alt="Distance" width={10} height={10} />
            {distance}
          </span>
          <span className="flex items-center gap-1">
            <Image
              src="/expiration.png"
              alt="Expiration"
              width={10}
              height={10}
            />
            {expiration}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardDiscountCompact;
