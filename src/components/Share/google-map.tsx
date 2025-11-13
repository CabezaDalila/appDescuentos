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
    <div className="w-full rounded-lg overflow-hidden border border-gray-200">
      <iframe
        width="100%"
        height="250"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={mapUrl}
        title={`Mapa de ubicación`}
      />
    </div>
  );
}
