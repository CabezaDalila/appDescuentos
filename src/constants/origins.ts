// Orígenes predefinidos para descuentos
export interface Origin {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  website?: string;
  category?: string;
  isActive: boolean;
}

export const DISCOUNT_ORIGINS: Origin[] = [
  {
    id: "mercadolibre",
    name: "MercadoLibre",
    displayName: "MercadoLibre",
    description: "Plataforma de e-commerce más grande de Latinoamérica",
    website: "https://mercadolibre.com",
    isActive: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    displayName: "Amazon",
    description: "Plataforma global de e-commerce",
    website: "https://amazon.com",
    isActive: true,
  },
  {
    id: "falabella",
    name: "Falabella",
    displayName: "Falabella",
    description: "Tienda departamental y e-commerce",
    website: "https://falabella.com",
    isActive: true,
  },
  {
    id: "sodimac",
    name: "Sodimac",
    displayName: "Sodimac",
    description: "Tienda de mejoramiento del hogar",
    website: "https://sodimac.com",
    isActive: true,
  },
  {
    id: "easy",
    name: "Easy",
    displayName: "Easy",
    description: "Tienda de mejoramiento del hogar",
    website: "https://easy.com",
    isActive: true,
  },
  {
    id: "jumbo",
    name: "Jumbo",
    displayName: "Jumbo",
    description: "Supermercado y retail",
    website: "https://jumbo.com",
    isActive: true,
  },
  {
    id: "santa_isabel",
    name: "Santa Isabel",
    displayName: "Santa Isabel",
    description: "Supermercado",
    website: "https://santaisabel.co",
    isActive: true,
  },
  {
    id: "tottus",
    name: "Tottus",
    displayName: "Tottus",
    description: "Supermercado",
    website: "https://tottus.com",
    isActive: true,
  },
  {
    id: "coto_digital",
    name: "Coto Digital",
    displayName: "Coto Digital",
    description: "Supermercado online",
    website: "https://cotodigital.com.ar",
    isActive: true,
  },
  {
    id: "carrefour",
    name: "Carrefour",
    displayName: "Carrefour",
    description: "Supermercado y retail",
    website: "https://carrefour.com.ar",
    isActive: true,
  },
  {
    id: "disco",
    name: "Disco",
    displayName: "Disco",
    description: "Supermercado",
    website: "https://disco.com.ar",
    isActive: true,
  },
  {
    id: "uber_eats",
    name: "Uber Eats",
    displayName: "Uber Eats",
    description: "Plataforma de delivery de comida",
    website: "https://ubereats.com",
    isActive: true,
  },
  {
    id: "rappi",
    name: "Rappi",
    displayName: "Rappi",
    description: "Plataforma de delivery",
    website: "https://rappi.com",
    isActive: true,
  },
  {
    id: "pedidos_ya",
    name: "PedidosYa",
    displayName: "PedidosYa",
    description: "Plataforma de delivery de comida",
    website: "https://pedidosya.com",
    isActive: true,
  },
  {
    id: "spotify",
    name: "Spotify",
    displayName: "Spotify",
    description: "Plataforma de streaming de música",
    website: "https://spotify.com",
    isActive: true,
  },
  {
    id: "netflix",
    name: "Netflix",
    displayName: "Netflix",
    description: "Plataforma de streaming de video",
    website: "https://netflix.com",
    isActive: true,
  },
  {
    id: "disney_plus",
    name: "Disney+",
    displayName: "Disney+",
    description: "Plataforma de streaming de video",
    website: "https://disneyplus.com",
    isActive: true,
  },
  {
    id: "mercadopago",
    name: "MercadoPago",
    displayName: "MercadoPago",
    description: "Plataforma de pagos digitales de MercadoLibre",
    website: "https://mercadopago.com.ar",
    isActive: true,
  },
  {
    id: "uala",
    name: "Ualá",
    displayName: "Ualá",
    description: "Billetera digital y tarjeta prepaga",
    website: "https://uala.com.ar",
    isActive: true,
  },
  {
    id: "personal_pay",
    name: "Personal Pay",
    displayName: "Personal Pay",
    description: "Billetera digital de Personal",
    website: "https://personalpay.com.ar",
    isActive: true,
  },
  {
    id: "modo",
    name: "Modo",
    displayName: "Modo",
    description: "Billetera digital de los bancos argentinos",
    website: "https://modo.com.ar",
    isActive: true,
  },
  {
    id: "naranja_x",
    name: "Naranja X",
    displayName: "Naranja X",
    description: "Billetera digital de Tarjeta Naranja",
    website: "https://naranjax.com",
    isActive: true,
  },
  {
    id: "fravega",
    name: "Fravega",
    displayName: "Fravega",
    description: "Electrodomésticos y tecnología",
    website: "https://fravega.com",
    isActive: true,
  },
  {
    id: "musimundo",
    name: "Musimundo",
    displayName: "Musimundo",
    description: "Electrodomésticos y tecnología",
    website: "https://musimundo.com",
    isActive: true,
  },
  {
    id: "compumundo",
    name: "Compumundo",
    displayName: "Compumundo",
    description: "Tecnología y computación",
    website: "https://compumundo.com.ar",
    isActive: true,
  },
  {
    id: "banco_santander",
    name: "Banco Santander",
    displayName: "Banco Santander",
    description: "Institución bancaria",
    isActive: true,
  },
  {
    id: "banco_itau",
    name: "Banco Itaú",
    displayName: "Banco Itaú",
    description: "Institución bancaria",
    isActive: true,
  },
  {
    id: "banco_nacion",
    name: "Banco Nación",
    displayName: "Banco Nación",
    description: "Banco de la Nación Argentina",
    website: "https://bna.com.ar",
    isActive: true,
  },
  {
    id: "banco_galicia",
    name: "Banco Galicia",
    displayName: "Banco Galicia",
    description: "Institución bancaria",
    website: "https://bancogalicia.com",
    isActive: true,
  },
  {
    id: "banco_macro",
    name: "Banco Macro",
    displayName: "Banco Macro",
    description: "Institución bancaria",
    website: "https://macro.com.ar",
    isActive: true,
  },
  {
    id: "bbva",
    name: "BBVA",
    displayName: "BBVA",
    description: "Institución bancaria",
    website: "https://bbva.com.ar",
    isActive: true,
  },
  {
    id: "icbc",
    name: "ICBC",
    displayName: "ICBC",
    description: "Institución bancaria",
    website: "https://icbc.com.ar",
    isActive: true,
  },
  {
    id: "movistar",
    name: "Movistar",
    displayName: "Movistar",
    description: "Empresa de telecomunicaciones",
    isActive: true,
  },
  {
    id: "claro",
    name: "Claro",
    displayName: "Claro",
    description: "Empresa de telecomunicaciones",
    isActive: true,
  },
  {
    id: "personal",
    name: "Personal",
    displayName: "Personal",
    description: "Empresa de telecomunicaciones",
    website: "https://personal.com.ar",
    isActive: true,
  },
  {
    id: "farmacity",
    name: "Farmacity",
    displayName: "Farmacity",
    description: "Farmacia y perfumería",
    website: "https://farmacity.com.ar",
    isActive: true,
  },
  {
    id: "farmacias_guadalupe",
    name: "Farmacias Guadalupe",
    displayName: "Farmacias Guadalupe",
    description: "Farmacia",
    website: "https://farmaciasguadalupe.com.ar",
    isActive: true,
  },
  {
    id: "farmacias_central",
    name: "Farmacias Central",
    displayName: "Farmacias Central",
    description: "Farmacia",
    website: "https://farmaciascentral.com.ar",
    isActive: true,
  },
  {
    id: "osde",
    name: "OSDE",
    displayName: "OSDE",
    description: "Obra social de salud",
    website: "https://osde.com.ar",
    isActive: true,
  },
  {
    id: "swiss_medical",
    name: "Swiss Medical",
    displayName: "Swiss Medical",
    description: "Obra social de salud",
    website: "https://swissmedical.com.ar",
    isActive: true,
  },
  // Bancos adicionales
  {
    id: "banco_provincia",
    name: "Banco Provincia",
    displayName: "Banco Provincia",
    description: "Banco de la Provincia de Buenos Aires",
    isActive: true,
  },
  {
    id: "banco_ciudad",
    name: "Banco Ciudad",
    displayName: "Banco Ciudad",
    description: "Banco de la Ciudad de Buenos Aires",
    isActive: true,
  },
  {
    id: "banco_hsbc",
    name: "Banco HSBC",
    displayName: "Banco HSBC",
    description: "Institución bancaria",
    isActive: true,
  },
  {
    id: "banco_bbva",
    name: "Banco BBVA",
    displayName: "Banco BBVA",
    description: "Institución bancaria",
    isActive: true,
  },
  {
    id: "banco_supervielle",
    name: "Banco Supervielle",
    displayName: "Banco Supervielle",
    description: "Institución bancaria",
    isActive: true,
  },

  // Clubes de beneficios
  {
    id: "club_la_nacion",
    name: "Club La Nación",
    displayName: "Club La Nación",
    description: "Club de beneficios de La Nación",
    isActive: true,
  },
  {
    id: "club_clarin",
    name: "Club Clarín",
    displayName: "Club Clarín",
    description: "Club de beneficios de Clarín",
    isActive: true,
  },
  {
    id: "club_personal",
    name: "Club Personal",
    displayName: "Club Personal",
    description: "Club de beneficios de Personal",
    isActive: true,
  },
  {
    id: "club_movistar",
    name: "Club Movistar",
    displayName: "Club Movistar",
    description: "Club de beneficios de Movistar",
    isActive: true,
  },
  {
    id: "club_claro",
    name: "Club Claro",
    displayName: "Club Claro",
    description: "Club de beneficios de Claro",
    isActive: true,
  },
  {
    id: "club_despegar",
    name: "Club Despegar",
    displayName: "Club Despegar",
    description: "Club de beneficios de Despegar",
    isActive: true,
  },
  {
    id: "club_mercado_libre",
    name: "Club Mercado Libre",
    displayName: "Club Mercado Libre",
    description: "Club de beneficios de Mercado Libre",
    isActive: true,
  },

  // Salud adicional
  {
    id: "medicus",
    name: "Medicus",
    displayName: "Medicus",
    description: "Obra social de salud",
    isActive: true,
  },
  {
    id: "omint",
    name: "Omint",
    displayName: "Omint",
    description: "Obra social de salud",
    isActive: true,
  },
  {
    id: "accord_salud",
    name: "Accord Salud",
    displayName: "Accord Salud",
    description: "Obra social de salud",
    isActive: true,
  },
  {
    id: "sancor_salud",
    name: "SanCor Salud",
    displayName: "SanCor Salud",
    description: "Obra social de salud",
    isActive: true,
  },

  // Educación
  {
    id: "uba",
    name: "Universidad de Buenos Aires",
    displayName: "Universidad de Buenos Aires",
    description: "Universidad pública",
    website: "https://uba.ar",
    isActive: true,
  },
  {
    id: "unlp",
    name: "Universidad Nacional de La Plata",
    displayName: "Universidad Nacional de La Plata",
    description: "Universidad pública",
    website: "https://unlp.edu.ar",
    isActive: true,
  },
  {
    id: "unc",
    name: "Universidad Nacional de Córdoba",
    displayName: "Universidad Nacional de Córdoba",
    description: "Universidad pública",
    website: "https://unc.edu.ar",
    isActive: true,
  },
  {
    id: "universidad_palermo",
    name: "Universidad de Palermo",
    displayName: "Universidad de Palermo",
    description: "Universidad privada",
    website: "https://palermo.edu",
    isActive: true,
  },
  {
    id: "universidad_san_andres",
    name: "Universidad de San Andrés",
    displayName: "Universidad de San Andrés",
    description: "Universidad privada",
    website: "https://udesa.edu.ar",
    isActive: true,
  },
  {
    id: "uca",
    name: "Universidad Católica Argentina",
    displayName: "Universidad Católica Argentina",
    description: "Universidad privada",
    website: "https://uca.edu.ar",
    isActive: true,
  },

  // Seguros
  {
    id: "la_caja",
    name: "La Caja",
    displayName: "La Caja",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "federacion_patronal",
    name: "Federación Patronal",
    displayName: "Federación Patronal",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "sancor_seguros",
    name: "Sancor Seguros",
    displayName: "Sancor Seguros",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "allianz",
    name: "Allianz",
    displayName: "Allianz",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "zurich",
    name: "Zurich",
    displayName: "Zurich",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "mapfre",
    name: "Mapfre",
    displayName: "Mapfre",
    description: "Compañía de seguros",
    isActive: true,
  },
  {
    id: "provincia_seguros",
    name: "Provincia Seguros",
    displayName: "Provincia Seguros",
    description: "Compañía de seguros",
    isActive: true,
  },

  // Telecomunicaciones adicionales
  {
    id: "telecom",
    name: "Telecom",
    displayName: "Telecom",
    description: "Empresa de telecomunicaciones",
    isActive: true,
  },
  {
    id: "fibertel",
    name: "Fibertel",
    displayName: "Fibertel",
    description: "Proveedor de internet y cable",
    isActive: true,
  },
  {
    id: "cablevision",
    name: "Cablevisión",
    displayName: "Cablevisión",
    description: "Proveedor de cable e internet",
    isActive: true,
  },
  {
    id: "directv",
    name: "DirecTV",
    displayName: "DirecTV",
    description: "Proveedor de TV satelital",
    isActive: true,
  },

  {
    id: "galeno",
    name: "Galeno",
    displayName: "Galeno",
    description: "Obra social de salud",
    website: "https://galeno.com.ar",
    isActive: true,
  },
  {
    id: "otro",
    name: "Otro",
    displayName: "Otro",
    description: "Otro origen no especificado",
    isActive: true,
  },
];

// Función para obtener origen por ID
export const getOriginById = (id: string): Origin | undefined => {
  return DISCOUNT_ORIGINS.find((origin) => origin.id === id);
};

// Función para obtener origen por nombre
export const getOriginByName = (name: string): Origin | undefined => {
  return DISCOUNT_ORIGINS.find(
    (origin) =>
      origin.id.toLowerCase() === name.toLowerCase() ||
      origin.name.toLowerCase() === name.toLowerCase()
  );
};

// Función para obtener todos los orígenes activos
export const getAllOrigins = (): Origin[] => {
  return DISCOUNT_ORIGINS.filter((origin) => origin.isActive);
};

// Función para validar si un origen es válido
export const isValidOrigin = (originId: string): boolean => {
  return DISCOUNT_ORIGINS.some(
    (origin) =>
      origin.id.toLowerCase() === originId.toLowerCase() && origin.isActive
  );
};

// Función para buscar orígenes por texto
export const searchOrigins = (searchText: string): Origin[] => {
  const textLower = searchText.toLowerCase();
  return DISCOUNT_ORIGINS.filter(
    (origin) =>
      origin.isActive &&
      (origin.name.toLowerCase().includes(textLower) ||
        origin.displayName.toLowerCase().includes(textLower) ||
        (origin.description &&
          origin.description.toLowerCase().includes(textLower)))
  );
};
