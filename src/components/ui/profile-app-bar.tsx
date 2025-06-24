import { Settings, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { useRouter } from 'next/router';
import React from 'react';

interface ProfileAppBarProps {
  onSettings: () => void;
  onLogout: () => void;
  title?: string;
}

export const ProfileAppBar: React.FC<ProfileAppBarProps> = ({ onSettings, onLogout, title = 'Mi Perfil' }) => {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm flex items-center justify-between h-14 px-4 border-b">
      {/* Volver */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Volver a inicio"
        onClick={() => router.push('/')}
        className="mr-2"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>
      {/* Título */}
      <h1 className="flex-1 text-center text-lg font-semibold select-none">
        {title}
      </h1>
      {/* Acciones */}
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Configuración"
          onClick={onSettings}
        >
          <Settings className="w-6 h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cerrar sesión"
          onClick={onLogout}
        >
          <LogOut className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );
}; 