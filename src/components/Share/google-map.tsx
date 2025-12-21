interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export function GoogleMap({ latitude, longitude, address }: GoogleMapProps) {
  const mapUrl = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        address
      )}&output=embed&z=15`
    : `https://www.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 relative">
      {/* Contenedor con overflow hidden para recortar el iframe */}
      <div className="relative h-[180px] overflow-hidden">
        {/* Iframe escalado para ocultar controles */}
        <div 
          style={{
            position: 'absolute',
            top: '-35%',
            left: '-15%',
            right: '-12%',
            bottom: '-30%',
            width: '127%',
            height: '165%',
          }}
        >
          <iframe
            style={{ 
              border: 0, 
              width: '100%',
              height: '100%',
            }}
            loading="lazy"
            src={mapUrl}
            title={`Mapa de ubicación`}
          />
        </div>
      </div>
      {/* Overlay para bloquear interacción */}
      <div className="absolute inset-0 z-10" />
    </div>
  );
}
