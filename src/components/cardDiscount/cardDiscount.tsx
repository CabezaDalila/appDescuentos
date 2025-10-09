import Image from "next/image";
import { useState } from "react";
import { Badge } from "../Share/badge";
import { Button } from "../Share/button";
import { Separator } from "../Share/separator";

interface CardDiscountProps {
  title: string;
  image: string;
  description: string;
  applyWith: string[];
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
  applyWith,
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
      <div className="flex flex-col gap-3">
        <h1 className="text-sm font-bold text-gray-600">Aplican</h1>
        <div className="flex  flex-wrap gap-2">
          {applyWith.map((item: string) => (
            <Badge key={item} variant="outline" className="text-gray-600 gap-2">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardDiscount;
