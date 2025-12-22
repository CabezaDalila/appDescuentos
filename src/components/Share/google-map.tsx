interface GoogleMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export function GoogleMap({ latitude, longitude, address }: GoogleMapProps) {
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 relative">
      <div className="relative h-[180px] overflow-hidden">
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
