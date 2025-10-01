
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, Trash2, PlusCircle, MinusCircle, Edit, MoreVertical } from 'lucide-react';

export default function ShoppingItemCard({ 
  item, 
  currentUser, 
  colocationMembers,
  onTakeResponsibility,
  onMarkPurchased,
  onDelete,
  onEdit,
  showResponsiblePerson = true
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const takenCareByMember = item.taken_care_by ? colocationMembers.find(m => m.email === item.taken_care_by) : null;
  
  const isMyItem = item.added_by === currentUser?.email;
  const isMyResponsibility = item.taken_care_by === currentUser?.email;
  const canMarkPurchased = isMyResponsibility && !item.is_purchased;

  const getAvatarColor = (email) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-green-500', 'bg-orange-500', 'bg-red-500'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const handleTakeResponsibilityToggle = () => {
    if (item.is_taken_care && isMyResponsibility) {
      onTakeResponsibility({ ...item, shouldUnassign: true });
    } else if (!item.is_taken_care || !item.taken_care_by) {
      onTakeResponsibility(item);
    }
  };

  // Vérifier s'il y a des détails à afficher
  const hasDetails = item.brand || item.image_url || item.quantity || item.estimated_price;

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      if (isMyItem && !item.is_purchased) {
        // Afficher options de modification/suppression
        const action = confirm("Que voulez-vous faire ?\nOK = Modifier\nAnnuler = Supprimer");
        if (action) {
          onEdit(item);
        } else if (action === false) {
          onDelete(item);
        }
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleContextMenu = (e) => {
    if (isMyItem && !item.is_purchased) {
      e.preventDefault(); // Prevent default browser context menu
      const action = confirm("Que voulez-vous faire ?\nOK = Modifier\nAnnuler = Supprimer");
      if (action) {
        onEdit(item);
      } else if (action === false) {
        onDelete(item);
      }
    }
  };

  return (
    <Card 
      className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 ${
        item.is_taken_care && !item.is_purchased ? 'bg-blue-50' : 'bg-white'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      <div className="p-2.5 rounded-lg">
        <div className="flex items-center justify-between">
          {/* Contenu principal */}
          <div className="flex items-center gap-2 flex-1">
            {/* Case à cocher pour "je m'en occupe" */}
            <Checkbox
              checked={item.is_taken_care}
              onCheckedChange={handleTakeResponsibilityToggle}
              className="w-5 h-5 flex-shrink-0 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              disabled={item.is_purchased || (item.is_taken_care && !isMyResponsibility)}
            />
            
            {/* Nom */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm text-gray-800">
                  {item.name}
                </h3>
                {item.is_urgent && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">
                    Urgent
                  </Badge>
                )}
              </div>
              
              {/* Qui s'en occupe */}
              {showResponsiblePerson && item.is_taken_care && takenCareByMember && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-3 h-3 rounded-full ${getAvatarColor(takenCareByMember.email)} flex-shrink-0`} />
                  <span className="text-xs text-gray-600">
                    {takenCareByMember.full_name?.split(' ')[0] || takenCareByMember.email.split('@')[0]} s'en occupe
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-1">
            {/* Bouton détails */}
            {hasDetails && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-7 h-7" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <MinusCircle className="w-4 h-4 text-gray-500" />
                ) : (
                  <PlusCircle className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            )}
            
            {/* Case "acheté" */}
            {canMarkPurchased && (
              <div className="flex items-center gap-1">
                <Checkbox
                  checked={item.is_purchased}
                  onCheckedChange={() => onMarkPurchased(item)}
                  className="w-4 h-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </div>
            )}
            
            {/* Badge acheté */}
            {item.is_purchased && (
              <Badge className="bg-blue-600 text-white text-xs">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Acheté
              </Badge>
            )}

            {/* Menu 3 points pour modifier/supprimer - masqué sur mobile si pas mon item */}
            {isMyItem && !item.is_purchased && (
              <DropdownMenu className="hidden md:block">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="w-4 h-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Détails étendus */}
        {isExpanded && hasDetails && (
          <div className="mt-2 pt-2 border-t border-gray-200 space-y-2 text-xs text-gray-600 ml-7">
            {item.quantity && (
              <p><strong>Quantité :</strong> {item.quantity}</p>
            )}
            {item.brand && (
              <p><strong>Marque :</strong> {item.brand}</p>
            )}
            {item.estimated_price && (
              <p><strong>Prix estimé :</strong> {item.estimated_price.toFixed(2)} €</p>
            )}
            {item.image_url && (
              <div>
                <p className="font-semibold mb-1">Lien / Image :</p>
                {item.image_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="rounded-md max-h-32 w-auto border shadow-sm" 
                  />
                ) : (
                  <a 
                    href={item.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {item.image_url}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
