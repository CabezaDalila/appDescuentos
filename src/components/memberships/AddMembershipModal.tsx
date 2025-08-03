import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../Share/dialog';
import { Button } from '../Share/button';
import { Input } from '../Share/input';
import { Label } from '../Share/label';
import { Separator } from '../Share/separator';
import { 
  Search, 
  Building2, 
  Plus,
  ArrowLeft,
  Check
} from 'lucide-react';
import { 
  MEMBERSHIP_CATEGORIES, 
  ENTITIES_BY_CATEGORY,
  CreateMembershipData 
} from '../../types/membership';

interface AddMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (membershipData: CreateMembershipData) => Promise<void>;
}

const AddMembershipModal: React.FC<AddMembershipModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [step, setStep] = useState<'category' | 'entity'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Colores predefinidos para cada categoría
  const categoryColors = {
    banco: '#2563eb',
    club: '#dc2626',
    salud: '#059669',
    educacion: '#7c3aed',
    seguro: '#ea580c',
    telecomunicacion: '#0891b2'
  };

  // Mapeo de bancos a logos locales
  const BANK_LOGOS: Record<string, string> = {
    'Banco Galicia': '/logos/bancos/Galicia.svg',
    // Puedes agregar más bancos aquí: 'Banco Santander': '/logos/bancos/Santander.png', etc.
  };

  // Mapeo de bancos a gradientes
  const BANK_GRADIENTS: Record<string, string> = {
    'Banco Galicia': 'from-yellow-500 to-orange-500',
    'Banco Santander': 'from-red-600 to-red-700',
    'Banco Nación': 'from-blue-600 to-blue-700',
    'Banco BBVA': 'from-blue-500 to-blue-600',
    'Banco HSBC': 'from-red-600 to-red-700',
    'Banco Macro': 'from-blue-400 to-blue-500',
    'Banco ICBC': 'from-red-500 to-red-600',
    'Banco Ciudad': 'from-yellow-600 to-yellow-700',
    'Banco Provincia': 'from-green-600 to-green-700',
    'Banco Credicoop': 'from-blue-700 to-blue-800',
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep('entity');
    setSearchTerm('');
    setSelectedEntity('');
    setCustomName('');
  };

  const handleEntitySelect = (entity: string) => {
    setSelectedEntity(entity);
    setCustomName(entity);
  };

  const handleCreate = async () => {
    if (!selectedCategory || !customName.trim() || !onCreate) return;

    // Asignar logo y gradiente automáticamente si es banco conocido
    let logoUrl: string | undefined = undefined;
    let gradient: string | undefined = undefined;
    if (selectedCategory === 'banco') {
      logoUrl = BANK_LOGOS[customName.trim()] || undefined;
      gradient = BANK_GRADIENTS[customName.trim()] || undefined;
    }

    try {
      setIsCreating(true);
      await onCreate({
        name: customName.trim(),
        category: selectedCategory as 'banco' | 'club' | 'salud' | 'educacion' | 'seguro' | 'telecomunicacion',
        color: categoryColors[selectedCategory as keyof typeof categoryColors] || '#6366f1',
        ...(logoUrl ? { logoUrl } : {}),
        ...(gradient ? { gradient } : {})
      });
      handleClose();
    } catch (error) {
      console.error('Error al crear membresía:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep('category');
    setSelectedCategory('');
    setSearchTerm('');
    setSelectedEntity('');
    setCustomName('');
    setIsCreating(false);
    onClose();
  };

  const filteredEntities = selectedCategory 
    ? ENTITIES_BY_CATEGORY[selectedCategory as keyof typeof ENTITIES_BY_CATEGORY]?.filter(
        entity => entity.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'category' ? (
              <>
                <Plus className="h-5 w-5" />
                Seleccionar Categoría
              </>
            ) : (
              <>
                <Building2 className="h-5 w-5" />
                Seleccionar Entidad
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'category' 
              ? 'Elige el tipo de membresía que quieres agregar'
              : 'Selecciona la entidad específica o ingresa un nombre personalizado'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'category' ? (
            // Paso 1: Selección de categoría
            <div className="space-y-3">
              {MEMBERSHIP_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategorySelect(category.value)}
                  className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: categoryColors[category.value as keyof typeof categoryColors] }}
                    >
                      {category.label.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{category.label}</h3>
                      <p className="text-sm text-gray-600">
                        {ENTITIES_BY_CATEGORY[category.value as keyof typeof ENTITIES_BY_CATEGORY]?.length || 0} entidades disponibles
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Paso 2: Selección de entidad
            <div className="space-y-4">
              {/* Header con categoría seleccionada */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setStep('category')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: categoryColors[selectedCategory as keyof typeof categoryColors] }}
                >
                  {MEMBERSHIP_CATEGORIES.find(c => c.value === selectedCategory)?.label.charAt(0)}
                </div>
                <span className="font-medium">
                  {MEMBERSHIP_CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </span>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lista de entidades */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEntities.map((entity) => (
                  <button
                    key={entity}
                    onClick={() => handleEntitySelect(entity)}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      selectedEntity === entity 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entity}</span>
                      {selectedEntity === entity && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Entrada personalizada */}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="customName">O ingresa un nombre personalizado</Label>
                <Input
                  id="customName"
                  placeholder="Ej: Mi banco personal"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              {/* Botón de crear */}
              <Button 
                onClick={handleCreate}
                disabled={!customName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? 'Creando...' : 'Crear Membresía'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembershipModal; 