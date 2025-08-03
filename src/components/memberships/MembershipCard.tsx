import React from 'react';
import { Card, CardContent } from '../Share/card';
import { Badge } from '../Share/badge';
import { Membership } from '../../types/membership';
import { CreditCard, Wifi, Star, MapPin, ChevronRight} from 'lucide-react';
import Image from 'next/image';

interface MembershipCardProps {
  membership: Membership;
  onClick?: () => void;
  variant?: 'carousel' | 'list';
  showStatus?: boolean;
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  membership,
  onClick,
  variant = 'carousel',
  showStatus = true
}) => {
  // Generar iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Obtener color de fondo basado en el color de la membresía
  const getBackgroundColor = (color: string) => {
    return color || '#6366f1'; // Color por defecto
  };

  // Obtener color de texto contrastante
  const getTextColor = (backgroundColor: string) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const backgroundColor = getBackgroundColor(membership.color);
  const textColor = getTextColor(backgroundColor);

  const cardClasses = `
    relative overflow-hidden transition-all duration-200 cursor-pointer
    ${variant === 'carousel' 
      ? 'w-64 h-32 flex-shrink-0' 
      : 'w-full h-24'
    }
    ${onClick ? 'hover:scale-105 hover:shadow-lg' : ''}
  `;

  // Permitir gradiente de fondo si existe
  const gradient = (membership as any).gradient as string | undefined;
  const hasGradient = !!gradient;
  // Iniciales si no hay logo
  const initials = getInitials(membership.name);

  // Footer para bancos
  // const renderBankFooter = () => (
  //   <div className="flex items-center justify-between mt-6">
  //     <div className="flex items-center gap-2 text-white/80">
  //       <Wifi className="w-5 h-5" />
  //       <span className="tracking-widest">**** **** **** ****</span>
  //     </div>
  //     <ChevronRight className="w-5 h-5 text-white/60" />
  //   </div>
  // );

  // Footer para otros
  // const renderOtherFooter = () => (
  //   <div className="flex items-center justify-between mt-6">
  //     <span className="text-xs text-white/70">Miembro desde {membership.createdAt instanceof Date ? membership.createdAt.getFullYear() : new Date(membership.createdAt).getFullYear()}</span>
  //     <ChevronRight className="w-5 h-5 text-white/60" />
  //   </div>
  // );

  // Beneficios destacados por tipo
  const BENEFITS: Record<string, { icon: React.ReactNode; text: string }[]> = {
    club: [
      { icon: <Star className="w-5 h-5" />, text: 'Descuentos exclusivos' },
      { icon: <MapPin className="w-5 h-5" />, text: 'Ubicaciones premium' }
    ],
    salud: [
      { icon: <Star className="w-5 h-5" />, text: 'Cobertura nacional' },
      { icon: <MapPin className="w-5 h-5" />, text: 'Red de prestadores' }
    ],
    educacion: [
      { icon: <Star className="w-5 h-5" />, text: 'Acceso a campus' },
      { icon: <MapPin className="w-5 h-5" />, text: 'Beneficios estudiantiles' }
    ],
    seguro: [
      { icon: <Star className="w-5 h-5" />, text: 'Protección total' },
      { icon: <MapPin className="w-5 h-5" />, text: 'Atención 24/7' }
    ],
    telecomunicacion: [
      { icon: <Star className="w-5 h-5" />, text: 'Planes exclusivos' },
      { icon: <MapPin className="w-5 h-5" />, text: 'Cobertura nacional' }
    ]
  };

  // Layout para bancos
  if (membership.category === 'banco') {
    return (
      <Card className={`relative overflow-hidden rounded-3xl shadow-md min-h-[200px] transition-all duration-200 hover:shadow-xl ${hasGradient ? `bg-gradient-to-r ${gradient}` : ''} ${cardClasses}`} onClick={onClick} style={!hasGradient ? { backgroundColor, color: textColor, position: 'relative', overflow: 'hidden', width: '344px' } : { color: textColor, position: 'relative', overflow: 'hidden', width: '344px' }}>
        {/* Overlay de luz sutil */}
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-white/10 rounded-full blur-2xl z-0" />
        {/* Logo de fondo tenue si existe */}
        {membership.logoUrl && (
          <Image
            src={membership.logoUrl}
            alt={membership.name + ' logo'}
            width={24}
            height={24}
            className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none select-none"
            style={{ zIndex: 0 }}
          />
        )}
        <CardContent className="relative z-10 px-8 py-4 pt-8 flex flex-col gap-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/30 shadow-sm">
                {membership.logoUrl ? (
                  <Image src={membership.logoUrl} alt={membership.name + ' logo'} width={24} height={24} className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-lg font-semibold text-white/80">{initials}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white/90 leading-tight">{membership.name}</h3>
                <p className="text-xs text-white/70 capitalize mt-0.5 tracking-wide">Banco</p>
              </div>
            </div>
            {showStatus && (
              <Badge 
                variant={membership.status === 'active' ? 'default' : 'secondary'}
                className="text-[11px] px-3 py-0.5 rounded-full bg-white/30 border-none text-white/90 font-medium shadow-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
              >
                {membership.status === 'active' ? 'Activa' : 'Inactiva'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-white/90 text-base font-medium">
            <CreditCard className="w-5 h-5 mr-1 text-white/70" />
            {membership.cards.length} Tarjeta{membership.cards.length !== 1 ? 's' : ''}
          </div>

          <div className="flex items-center justify-between pb-0">
            <div className="flex items-center text-white/80 text-sm font-normal">
              <Wifi className="w-5 h-5 mr-1" />
              <span className="tracking-widest" style={{ marginLeft: '10px' }}>**** **** **** ****</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80" />
          </div>
        </CardContent>

      </Card>
    );
  }

 // Layout para otras categorías
const benefits = BENEFITS[membership.category] || [];

return (
  <Card
    className={`relative overflow-hidden rounded-3xl shadow-md min-h-[200px] transition-all duration-200 hover:shadow-xl ${
      hasGradient ? `bg-gradient-to-r ${gradient}` : ''
    } ${cardClasses}`}
    onClick={onClick}
    style={
      !hasGradient
        ? {
            backgroundColor,
            color: textColor,
            position: 'relative',
            overflow: 'hidden',
            width: '344px',
          }
        : { color: textColor, position: 'relative', overflow: 'hidden', width: '344px' }
    }
  >
    {membership.logoUrl && (
      <Image
        src={membership.logoUrl}
        alt={`${membership.name} logo`}
        className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      />
    )}
    <CardContent className="relative z-10 px-8 py-4 pt-8 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/30 shadow-sm">
            {membership.logoUrl ? (
              <Image
                src={membership.logoUrl}
                alt={`${membership.name} logo`}
                width={24}
                height={24}
                className="w-6 h-6 object-contain opacity-90"
              />
            ) : (
              <Star className="w-5 h-5 text-white/80 opacity-90" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white/90 leading-tight">{membership.name}</h3>
            <p className="text-xs text-white/80 capitalize mt-0.5 tracking-wide">
              {membership.category === 'club'
                ? 'Club de Beneficios'
                : membership.category.charAt(0).toUpperCase() + membership.category.slice(1)}
            </p>
          </div>
        </div>
        {showStatus && (
          <Badge
            variant={membership.status === 'active' ? 'default' : 'secondary'}
            className="text-[11px] px-3 py-0.5 rounded-full bg-white/30 border-none text-white/90 font-medium shadow-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
            }}
          >
            {membership.status === 'active' ? 'Activa' : 'Inactiva'}
          </Badge>
        )}
      </div>

      {/* Beneficios */}
      <div className="flex flex-col gap-1 mt-5 text-white/90 text-base font-normal opacity-90">
        <div className="flex items-center gap-2">
          {benefits[0]?.icon}
          <span>{benefits[0]?.text}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {benefits[1]?.icon}
            <span>{benefits[1]?.text}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </div>
      </div>
    </CardContent>
  </Card>
);

};

export default MembershipCard; 