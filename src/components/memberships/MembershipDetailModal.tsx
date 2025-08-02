import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Edit, 
  Trash2, 
  Plus, 
  CreditCard, 
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Membership, Card, MEMBERSHIP_CATEGORIES, CARD_LEVELS, CardLevel } from '../../types/membership';

interface MembershipDetailModalProps {
  membership: Membership | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (membershipId: string, data: any) => Promise<void>;
  onDelete?: (membershipId: string) => Promise<void>;
  onAddCard?: (membershipId: string, cardData: any) => Promise<void>;
  onUpdateCard?: (membershipId: string, cardId: string, cardData: any) => Promise<void>;
  onDeleteCard?: (membershipId: string, cardId: string) => Promise<void>;
}

const MembershipDetailModal: React.FC<MembershipDetailModalProps> = ({
  membership,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddCard,
  onUpdateCard,
  onDeleteCard
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<Partial<Membership>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Estados para gestión de tarjetas
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardFormData, setCardFormData] = useState({
    type: 'Crédito' as Card['type'],
    brand: 'Visa' as Card['brand'],
    last4: '',
    level: 'Classic' as CardLevel,
    name: ''
  });

  const [localStatus, setLocalStatus] = useState<Membership['status']>('active');
  const [localMembership, setLocalMembership] = useState<Membership | null>(membership);

  React.useEffect(() => {
    setLocalMembership(membership);
    if (membership) {
      setEditData({
        name: membership.name,
        category: membership.category,
        color: membership.color,
        status: membership.status
      });
      setLocalStatus(membership.status);
    }
  }, [membership]);

  const handleSave = async () => {
    if (!membership || !onUpdate) return;
    
    try {
      await onUpdate(membership.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar membresía:', error);
    }
  };

  const handleDelete = async () => {
    if (!membership || !onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(membership.id);
      onClose();
    } catch (error) {
      console.error('Error al eliminar membresía:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!membership || !onUpdate) return;
    const newStatus = localStatus === 'active' ? 'inactive' : 'active';
    setLocalStatus(newStatus); // feedback inmediato
    try {
      await onUpdate(membership.id, { status: newStatus });
    } catch (error) {
      setLocalStatus(localStatus); // revertir si falla
      console.error('Error al cambiar estado:', error);
    }
  };

  // Funciones para gestión de tarjetas
  const handleAddCard = () => {
    setCardFormData({
      type: 'Crédito',
      brand: 'Visa',
      last4: '',
      level: 'Classic',
      name: ''
    });
    setShowAddCardModal(true);
  };

  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setCardFormData({
      type: card.type,
      brand: card.brand,
      last4: card.last4,
      level: card.level,
      name: card.name || ''
    });
    setShowEditCardModal(true);
  };

  const handleSaveCard = async () => {
    if (!localMembership || !cardFormData.last4.trim() || !cardFormData.level) return;
    const newCard: Card = {
      id: Date.now().toString(),
      ...cardFormData
    };
    // Actualización optimista
    setLocalMembership({
      ...localMembership,
      cards: [...localMembership.cards, newCard]
    });
    setShowAddCardModal(false);
    setShowEditCardModal(false);
    setSelectedCard(null);
    setCardFormData({ type: 'Crédito', brand: 'Visa', last4: '', level: 'Classic', name: '' });
    try {
      if (showEditCardModal && selectedCard && onUpdateCard) {
        await onUpdateCard(localMembership.id, selectedCard.id, cardFormData);
      } else if (showAddCardModal && onAddCard) {
        await onAddCard(localMembership.id, cardFormData);
      }
    } catch (error) {
      // Revertir si falla
      setLocalMembership(membership);
      console.error('Error al guardar tarjeta:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!localMembership || !onDeleteCard) return;
    const prevCards = localMembership.cards;
    setLocalMembership({
      ...localMembership,
      cards: localMembership.cards.filter(card => card.id !== cardId)
    });
    try {
      await onDeleteCard(localMembership.id, cardId);
    } catch (error) {
      // Revertir si falla
      setLocalMembership({ ...localMembership, cards: prevCards });
      console.error('Error al eliminar tarjeta:', error);
    }
  };

  if (!localMembership) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editar Membresía
                </>
              ) : (
                localMembership.name
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalle y acciones de la membresía seleccionada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información básica */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Categoría</span>
                <Badge variant="outline" className="capitalize">
                  {localMembership.category}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localStatus === 'active'}
                    onCheckedChange={handleStatusToggle}
                  />
                  <Badge variant={localStatus === 'active' ? 'default' : 'secondary'}>
                    {localStatus === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sección de tarjetas (solo para bancos) */}
            {localMembership.category === 'banco' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tarjetas asociadas
                    </h4>
                    {onAddCard && (
                      <Button size="sm" variant="outline" onClick={handleAddCard}>
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir
                      </Button>
                    )}
                  </div>

                  {localMembership.cards.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay tarjetas asociadas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {localMembership.cards.map((card) => (
                        <div 
                          key={card.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{card.type}</p>
                            <p className="text-xs text-gray-600">
                              {card.brand} •••• {card.last4} {card.level}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditCard(card)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Acciones */}
            <Separator />
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>

            {/* Confirmación de eliminación */}
            {showDeleteConfirm && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">¿Eliminar membresía?</p>
                    <p className="text-sm text-red-600 mt-1">
                      Esta acción no se puede deshacer. Se eliminarán todas las tarjetas asociadas.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar/editar tarjeta */}
      {(showAddCardModal || showEditCardModal) && (
        <Dialog 
          open={showAddCardModal || showEditCardModal} 
          onOpenChange={() => {
            setShowAddCardModal(false);
            setShowEditCardModal(false);
            setSelectedCard(null);
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {showAddCardModal ? 'Agregar Tarjeta' : 'Editar Tarjeta'}
              </DialogTitle>
              <DialogDescription>
                {showAddCardModal 
                  ? 'Agrega una nueva tarjeta a tu membresía'
                  : 'Modifica los datos de la tarjeta'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardType">Tipo</Label>
                <select
                  id="cardType"
                  value={cardFormData.type}
                  onChange={(e) => setCardFormData({ ...cardFormData, type: e.target.value as Card['type'] })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                </select>
              </div>

              <div>
                <Label htmlFor="cardBrand">Marca</Label>
                <select
                  id="cardBrand"
                  value={cardFormData.brand}
                  onChange={(e) => setCardFormData({ ...cardFormData, brand: e.target.value as Card['brand'] })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                  <option value="Diners Club">Diners Club</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <Label htmlFor="cardLevel">Nivel</Label>
                <select
                  id="cardLevel"
                  value={cardFormData.level}
                  onChange={(e) => setCardFormData({ ...cardFormData, level: e.target.value as CardLevel })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="" disabled>Selecciona un nivel</option>
                  {CARD_LEVELS.map(lvl => (
                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="cardLast4">Últimos 4 dígitos</Label>
                <Input
                  id="cardLast4"
                  value={cardFormData.last4}
                  onChange={(e) => setCardFormData({ ...cardFormData, last4: e.target.value })}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              <div>
                <Label htmlFor="cardName">Nombre (opcional)</Label>
                <Input
                  id="cardName"
                  value={cardFormData.name}
                  onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })}
                  placeholder="Mi tarjeta personal"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveCard} className="flex-1" disabled={!cardFormData.level}>
                  {showAddCardModal ? 'Agregar' : 'Guardar'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddCardModal(false);
                    setShowEditCardModal(false);
                    setSelectedCard(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MembershipDetailModal; 