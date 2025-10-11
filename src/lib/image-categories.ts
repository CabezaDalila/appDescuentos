/**
 * Función para obtener la imagen por defecto de una categoría
 * @param category - Nombre de la categoría
 * @returns Ruta de la imagen por defecto para la categoría
 */
export const getImageByCategory = (category?: string): string => {
  if (!category) {
    return "/imgDefault.svg";
  }

  const categoryLower = category.toLowerCase();

  // Mapeo de categorías a sus imágenes por defecto
  const categoryImageMap: { [key: string]: string } = {
    // Alimentos
    alimentos: "/food/default.avif",
    food: "/food/default.avif",
    comida: "/food/default.avif",
    restaurante: "/food/default.avif",
    supermercado: "/food/default.avif",
    gastronomía: "/food/default.avif",
    café: "/food/default.avif",

    // Moda
    moda: "/fashion/default.avif",
    fashion: "/fashion/default.avif",
    ropa: "/fashion/default.avif",
    vestimenta: "/fashion/default.avif",
    accesorios: "/fashion/default.avif",
    zapatos: "/fashion/default.avif",
    bolsos: "/fashion/default.avif",

    // Tecnología
    tecnología: "/technology/default.avif",
    technology: "/technology/default.avif",
    electrónicos: "/technology/default.avif",
    computadoras: "/technology/default.avif",
    celulares: "/technology/default.avif",
    tablets: "/technology/default.avif",
    gaming: "/technology/default.avif",

    // Hogar
    hogar: "/home/default.avif",
    home: "/home/default.avif",
    decoración: "/home/default.avif",
    muebles: "/home/default.avif",
    jardín: "/home/default.avif",
    bricolaje: "/home/default.avif",
    cocina: "/home/default.avif",

    // Deportes
    deportes: "/sports/default.avif",
    sports: "/sports/default.avif",
    fitness: "/sports/default.avif",
    outdoor: "/sports/default.avif",
    gimnasio: "/sports/default.avif",
    running: "/sports/default.avif",
    yoga: "/sports/default.avif",

    // Belleza
    belleza: "/beauty/default.webp",
    beauty: "/beauty/default.webp",
    cosméticos: "/beauty/default.webp",
    perfumes: "/beauty/default.webp",
    maquillaje: "/beauty/default.webp",
    skincare: "/beauty/default.webp",
    peluquería: "/beauty/default.webp",

    // Automóviles
    automóviles: "/automotive/default.avif",
    automotive: "/automotive/default.avif",
    vehículos: "/automotive/default.avif",
    transporte: "/automotive/default.avif",
    motos: "/automotive/default.avif",
    bicicletas: "/automotive/default.avif",
    repuestos: "/automotive/default.avif",

    // Entretenimiento
    entretenimiento: "/entertainment/default.avif",
    entertainment: "/entertainment/default.avif",
    cine: "/entertainment/default.avif",
    teatro: "/entertainment/default.avif",
    música: "/entertainment/default.avif",
    libros: "/entertainment/default.avif",
    juegos: "/entertainment/default.avif",

    // Salud
    salud: "/health/default.avif",
    health: "/health/default.avif",
    farmacia: "/health/default.avif",
    médico: "/health/default.avif",
    dentista: "/health/default.avif",
    óptica: "/health/default.avif",
    bienestar: "/health/default.avif",

    // Educación
    educación: "/education/default.avif",
    education: "/education/default.avif",
    cursos: "/education/default.avif",
    universidad: "/education/default.avif",
    escuela: "/education/default.avif",
    idiomas: "/education/default.avif",
    capacitación: "/education/default.avif",

    // General (por defecto)
    general: "/imgDefault.svg",
    varios: "/imgDefault.svg",
    otros: "/imgDefault.svg",
    promociones: "/imgDefault.svg",
    descuentos: "/imgDefault.svg",
    oferta: "/imgDefault.svg",
    promo: "/imgDefault.svg",
  };

  // Buscar coincidencia exacta
  if (categoryImageMap[categoryLower]) {
    return categoryImageMap[categoryLower];
  }

  // Buscar coincidencia parcial en las claves
  for (const [key, imagePath] of Object.entries(categoryImageMap)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return imagePath;
    }
  }

  // Si no se encuentra coincidencia, devolver imagen por defecto
  return "/imgDefault.svg";
};
