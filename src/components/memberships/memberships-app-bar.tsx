import React from "react";

interface MembershipsAppBarProps {
  onBack?: () => void;
}

export const MembershipsAppBar: React.FC<MembershipsAppBarProps> = ({ onBack }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b flex items-center h-16 px-4 shadow-sm">
      {onBack && (
        <button
          onClick={onBack}
          className="mr-2 p-2 rounded hover:bg-gray-100 focus:outline-none"
          aria-label="Volver"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left w-5 h-5"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>
      )}
      <h1 className="text-lg font-bold flex-1 text-center">Mis Membresías</h1>
      {/* Espacio para centrar el título si hay botón de back */}
      {onBack && <span className="w-8" />}
    </header>
  );
};

export default MembershipsAppBar; 