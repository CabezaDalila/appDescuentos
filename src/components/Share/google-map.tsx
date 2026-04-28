interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  /** Mapa más bajo (p. ej. detalle de descuento para menos scroll). */
  compact?: boolean;
}

export function GoogleMap({
  latitude,
  longitude,
  address,
  compact = false,
}: GoogleMapProps) {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`;
  const frameHeight = compact ? "h-[100px]" : "h-[180px]";

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 relative">
      <div className={`relative overflow-hidden ${frameHeight}`}>
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
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <div className="absolute inset-0 z-10" />
    </div>
  );
}
