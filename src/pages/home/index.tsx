import CardDiscountCompact from "@/components/cardDiscount/CardDiscountCompact";
import SearchDiscount from "@/components/search/searchDiscount";
import { useRouter } from "next/router";

const discounts = [
  {
    id: "easy",
    title: "Easy",
    image: "/primary_image.jpg",
    category: "Supermercado",
    discountPercentage: "25%",
    points: 6,
    distance: "1.2km",
    expiration: "10/10/2025",
  },
  {
    id: "coto",
    title: "Coto",
    image: "/primary_image.jpg",
    category: "Supermercado",
    discountPercentage: "20%",
    points: 6,
    distance: "1.2km",
    expiration: "10/10/2025",
  },

  {
    id: "carrefour",
    title: "Carrefour",
    image: "/primary_image.jpg",
    category: "Supermercado",
    discountPercentage: "20%",
    points: 6,
    distance: "1.2km",
    expiration: "10/10/2025",
  },
  {
    id: "makro",
    title: "Makro",
    image: "/primary_image.jpg",
    category: "Supermercado",
    discountPercentage: "5%",
    points: 6,
    distance: "1.2km",
    expiration: "10/10/2025",
  },
];

export default function Home() {
  const router = useRouter();

  const handleNavigateToDetail = (discountId: string) => {
    router.push(`/discount/${discountId}`);
  };

  return (
    <div>
      <SearchDiscount />
      <div className="flex flex-wrap gap-8 p-2">
        {/* <CardDiscount
          title="20% de descuento en celulares seleccionados"
          image="/primary_image.jpg"
          description="20% de descuento exclusivo en celulares seleccionados de última generación."
          applyWith={[
            "Bancos participantes",
            "Bancos participantes",
            "Bancos participantes",
          ]}
          category="Celulares"
          points={6}
          countComments={10}
          distance="1.2km"
          expiration="10/10/2025"
        /> */}
        {discounts.map((discount) => (
          <CardDiscountCompact
            key={discount.title}
            title={discount.title}
            image={discount.image}
            category={discount.category}
            points={discount.points}
            distance={discount.distance}
            expiration={discount.expiration}
            discountPercentage={discount.discountPercentage}
            onNavigateToDetail={() => handleNavigateToDetail(discount.id)}
          />
        ))}
      </div>
    </div>
  );
}
