import CardDiscount from "@/components/cardDiscount/cardDiscount";
import { BackButton } from "@/components/Share/back-button";

export default function DiscountDetail() {
  // Get a firebase para obtener los datos del descuento por ID
  //Datos de ejemplo
  const discountData = {
    title: "20% de descuento en celulares seleccionados",
    image: "/primary_image.jpg",
    description:
      "20% de descuento exclusivo en celulares seleccionados de última generación.",
    applyWith: [
      "Bancos participantes",
      "Bancos participantes",
      "Bancos participantes",
    ],
    category: "Celulares",
    points: 6,
    countComments: 10,
    distance: "1.2km",
    expiration: "10/10/2025",
    discountPercentage: "20%",
  };

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
        <CardDiscount
          title={discountData.title}
          image={discountData.image}
          description={discountData.description}
          applyWith={discountData.applyWith}
          category={discountData.category}
          points={discountData.points}
          countComments={discountData.countComments}
          distance={discountData.distance}
          expiration={discountData.expiration}
          discountPercentage={discountData.discountPercentage}
        />
      </div>
    </div>
  );
}
