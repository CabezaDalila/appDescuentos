import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserPreferences, getUserPreferences } from '@/lib/firebase/user';
import { UserPreferences } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import toast from 'react-hot-toast';
import { Info, Globe } from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: UserPreferences;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = React.memo(function UserSettingsModal({ 
  isOpen, 
  onClose, 
  initialValues 
}: UserSettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState<UserPreferences>({
    language: 'es',
    region: '',
    useLocation: false,
  });

  // Estado inicial para comparar cambios
  const [initialPrefs, setInitialPrefs] = useState<UserPreferences | null>(null);

  // Referencia para focus management
  const languageRef = useRef<HTMLButtonElement | null>(null);

  // Validación de región
  const [regionError, setRegionError] = useState<string | null>(null);

  // Cargar preferencias iniciales
  const loadUserPreferences = useCallback(async () => {
    try {
      if (!user?.uid) return;
      const preferences = await getUserPreferences(user.uid);
      if (preferences) {
        setFormData(preferences);
        if (!initialPrefs) setInitialPrefs(preferences);
      } else {
        // Fallback: intentar cargar de localStorage
        const local = localStorage.getItem(`user-prefs-${user.uid}`);
        if (local) {
          const localPrefs = JSON.parse(local);
          setFormData(localPrefs);
          if (!initialPrefs) setInitialPrefs(localPrefs);
        } else {
          const lang = navigator.language.startsWith('es') ? 'es' : 'en';
          const defaultPrefs: UserPreferences = {
            language: lang,
            region: '',
            useLocation: false,
          };
          setFormData(defaultPrefs);
          if (!initialPrefs) setInitialPrefs(defaultPrefs);
        }
      }
    } catch (error) {
      console.error('Error al cargar preferencias:', error);
    }
  }, [user?.uid, initialPrefs]);

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadUserPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.uid, loadUserPreferences]);

  // Detección automática de región por IP si no hay región guardada
  useEffect(() => {
    if (isOpen && !formData.region) {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data && data.country_name) {
            setFormData(prev => ({ ...prev, region: data.country_name }));
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (initialPrefs) {
      const hasFormChanges =
        formData.language !== initialPrefs.language ||
        formData.region !== initialPrefs.region ||
        formData.useLocation !== initialPrefs.useLocation;
      setHasChanges(hasFormChanges);
    } else {
      setHasChanges(false);
    }
  }, [formData, initialPrefs]);

  useEffect(() => {
    if (isOpen && languageRef.current) {
      setTimeout(() => languageRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.region.trim() === '') {
      setRegionError('La región no puede estar vacía');
    } else {
      setRegionError(null);
    }
  }, [formData.region]);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateUserPreferences(user.uid, formData);
      localStorage.setItem(`user-prefs-${user.uid}`, JSON.stringify(formData));
      if (formData.useLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Ubicación obtenida:', position.coords);
          },
          (error) => {
            console.error('Error al obtener ubicación:', error);
            setFormData(prev => ({ ...prev, useLocation: false }));
            toast.error('No se pudo obtener la ubicación.');
          }
        );
      }
      setInitialPrefs(formData);
      onClose();
    } catch (error) {
      localStorage.setItem(`user-prefs-${user.uid}`, JSON.stringify(formData));
      toast.error('No se pudo guardar en la nube, pero tus preferencias se guardaron localmente.');
      setInitialPrefs(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, formData, onClose]);

  const handleCancel = useCallback(() => {
    // Restaurar valores iniciales
    if (initialPrefs) {
      setFormData(initialPrefs);
    }
    onClose();
  }, [initialPrefs, onClose]);

  const handleLocationToggle = useCallback((checked: boolean) => {
    if (checked) {
      // Solicitar permisos de geolocalización
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({ ...prev, useLocation: true }));
        },
        (error) => {
          console.error('Permisos de ubicación denegados:', error);
          // No cambiar el estado si se deniega
        }
      );
    } else {
      setFormData(prev => ({ ...prev, useLocation: false }));
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración de Usuario</DialogTitle>
          <DialogDescription className="sr-only">
            Personaliza tus preferencias de idioma, región y ubicación.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'general'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'appearance'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Apariencia
          </button>
        </div>

        {/* Contenido de tabs */}
        <div className="py-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Idioma */}
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'es' | 'en') =>
                    setFormData(prev => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger ref={languageRef as React.Ref<HTMLButtonElement>} aria-label="Selecciona el idioma">
                    <SelectValue>{formData.language === 'es' ? 'Español' : 'English'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Región */}
              <div className="space-y-2">
                <Label htmlFor="region">Región</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, region: e.target.value }))
                  }
                  placeholder="Ingresa tu región"
                  aria-invalid={!!regionError}
                  aria-describedby="region-error"
                />
                {regionError && (
                  <span id="region-error" className="text-xs text-red-500">{regionError}</span>
                )}
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <Label htmlFor="useLocation" className="mb-0">Usar ubicación actual</Label>
                  </div>
                  <Switch
                    id="useLocation"
                    checked={formData.useLocation}
                    onCheckedChange={handleLocationToggle}
                    aria-checked={formData.useLocation}
                    aria-label="Activar o desactivar uso de ubicación"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Las opciones de apariencia estarán disponibles en una futura actualización.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer con botones */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-6">
          <Button variant="outline" onClick={handleCancel} className="px-6 py-2">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !initialPrefs || !hasChanges || !!regionError}
            aria-disabled={isSaving || !initialPrefs || !hasChanges || !!regionError}
            className="px-6 py-2 bg-primary text-white hover:bg-primary/90"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default UserSettingsModal; 