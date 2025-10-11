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
      className="flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full max-w-full"
      onClick={handleCardClick}
    >
      <div className="relative h-24 sm:h-32 w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-t-lg"
        />

        {/* Badge de descuento */}
        {discountPercentage && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
            <Badge
              variant="default"
              className="bg-purple-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5"
            >
              {discountPercentage}
            </Badge>
          </div>
        )}

        {/* Botón de like */}
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 sm:h-6 sm:w-6 p-0 bg-white/70 hover:bg-white rounded-full"
            onClick={handleLike}
          >
            <Image
              src={isLiked ? "/loveRed.png" : "/love.png"}
              alt="Like"
              width={12}
              height={12}
              className="sm:w-[14px] sm:h-[14px]"
            />
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Categoría y rating */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
            {category}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-0.5 sm:gap-1">
            <Image
              src="/star.png"
              alt="Star"
              width={8}
              height={8}
              className="sm:w-[10px] sm:h-[10px]"
            />
            {points}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-tight break-words">
          {title}
        </h3>

        {/* Información adicional */}
        <div className="flex items-center justify-between text-[9px] sm:text-xs text-gray-500">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Image
              src="/distance.png"
              alt="Distance"
              width={8}
              height={8}
              className="sm:w-[10px] sm:h-[10px]"
            />
            {distance}
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Image
              src="/expiration.png"
              alt="Expiration"
              width={8}
              height={8}
              className="sm:w-[10px] sm:h-[10px]"
            />
            {expiration}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardDiscountCompact;
