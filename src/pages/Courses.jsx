
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { ShoppingItem } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, ShoppingCart } from 'lucide-react';
import { getWeek, getYear } from 'date-fns';
import WeekSelector from '@/components/shopping/WeekSelector';
import ShoppingItemCard from '@/components/shopping/ShoppingItemCard';
import ModernShoppingForm from "@/components/shopping/ModernShoppingForm";

export default function CoursesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [colocationMembers, setColocationMembers] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // New state for editing

  // Semaine actuelle par défaut - se met à jour automatiquement
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const weekNum = getWeek(now, { weekStartsOn: 1 });
    const year = getYear(now);
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.colocation_id) {
        const [shoppingData, membersData] = await Promise.all([
          ShoppingItem.filter({ colocation_id: user.colocation_id, week_year: currentWeek }, '-created_date'),
          User.filter({ colocation_id: user.colocation_id })
        ]);
        setItems(shoppingData);
        setColocationMembers(membersData);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
    setIsLoading(false);
  }, [currentWeek]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mise à jour automatique de la semaine actuelle
  useEffect(() => {
    const updateCurrentWeek = () => {
      const now = new Date();
      const weekNum = getWeek(now, { weekStartsOn: 1 });
      const year = getYear(now);
      const newCurrentWeek = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      
      setCurrentWeek(prev => {
        const [prevYear, prevWeek] = prev.split('-W');
        const prevWeekNum = parseInt(prevWeek);
        const prevYearNum = parseInt(prevYear);
        
        if (prevYearNum < year || (prevYearNum === year && prevWeekNum < weekNum)) {
          return newCurrentWeek;
        }
        return prev;
      });
    };

    const interval = setInterval(updateCurrentWeek, 3600000);
    return () => clearInterval(interval);
  }, []);

  // handleAddItem now expects itemData as an argument from ModernShoppingForm
  const handleAddItem = async (itemData) => {
    if (!itemData.name.trim()) return;
    
    try {
      if (editingItem) {
        // Mode édition
        await ShoppingItem.update(editingItem.id, {
          name: itemData.name,
          quantity: itemData.quantity,
          brand: itemData.brand,
          is_urgent: itemData.is_urgent,
          image_url: itemData.image_url,
          estimated_price: itemData.estimated_price ? parseFloat(itemData.estimated_price) : null,
          category: itemData.category || 'autre'
        });
      } else {
        // Mode création
        await ShoppingItem.create({
          name: itemData.name,
          quantity: itemData.quantity,
          brand: itemData.brand,
          is_urgent: itemData.is_urgent,
          image_url: itemData.image_url,
          estimated_price: itemData.estimated_price ? parseFloat(itemData.estimated_price) : null,
          category: itemData.category || 'autre',
          colocation_id: currentUser.colocation_id,
          added_by: currentUser.email,
          week_year: currentWeek
        });
      }
      
      setShowAddForm(false);
      setEditingItem(null); // Reset editing item after operation
      
      loadData();
    } catch (error) {
      console.error("Erreur d'ajout/modification:", error); // Updated error message
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleTakeResponsibility = async (item) => {
    try {
      if (item.shouldUnassign) {
        // Se désister de la responsabilité
        await ShoppingItem.update(item.id, {
          is_taken_care: false,
          taken_care_by: null
        });
      } else {
        // Prendre la responsabilité
        await ShoppingItem.update(item.id, {
          is_taken_care: true,
          taken_care_by: currentUser.email
        });
      }
      loadData();
    } catch (error) {
      console.error("Erreur lors de la prise en charge:", error);
    }
  };

  const handleMarkPurchased = async (item) => {
    try {
      await ShoppingItem.update(item.id, {
        is_purchased: !item.is_purchased
      });
      loadData();
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
    }
  };

  const handleDelete = async (item) => {
    if (confirm('Supprimer cet article ?')) {
      try {
        await ShoppingItem.delete(item.id);
        loadData();
      } catch (error) {
        console.error("Erreur de suppression:", error);
      }
    }
  };

  // Fonction pour grouper les articles par personne responsable
  const groupItemsByResponsible = (items) => {
    const groups = {};
    const unassigned = [];

    items.forEach(item => {
      if (item.is_taken_care && item.taken_care_by) {
        if (!groups[item.taken_care_by]) {
          groups[item.taken_care_by] = [];
        }
        groups[item.taken_care_by].push(item);
      } else {
        unassigned.push(item);
      }
    });

    return { groups, unassigned };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { groups, unassigned } = groupItemsByResponsible(items);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Liste de courses</h1>
            <p className="text-sm text-gray-600">Organisez vos achats par semaine</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(prev => !prev);
              setEditingItem(null); // Always clear editingItem when toggling the form via Plus button
            }}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-10 w-10"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {!showAddForm && <WeekSelector currentWeek={currentWeek} onWeekChange={setCurrentWeek} />}

        {showAddForm && (
          <ModernShoppingForm
            item={editingItem} // Pass the item being edited
            onSubmit={handleAddItem}
            onCancel={handleCancelForm} // Use new handleCancelForm
            currentUser={currentUser}
            currentWeek={currentWeek}
          />
        )}

        <div className="space-y-4">
          {/* Articles non assignés */}
          {unassigned.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-600 px-1">Articles disponibles</h3>
              <div className="space-y-1">
                {unassigned.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    currentUser={currentUser}
                    colocationMembers={colocationMembers}
                    onTakeResponsibility={handleTakeResponsibility}
                    onMarkPurchased={handleMarkPurchased}
                    onDelete={handleDelete}
                    onEdit={handleEditItem} // Add onEdit prop
                    showResponsiblePerson={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Articles groupés par personne responsable */}
          {Object.entries(groups).map(([responsibleEmail, responsibleItems]) => {
            const responsibleMember = colocationMembers.find(m => m.email === responsibleEmail);
            const memberName = responsibleMember?.full_name?.split(' ')[0] || responsibleEmail.split('@')[0];
            
            return (
              <div key={responsibleEmail} className="space-y-1">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-4 h-4 rounded-full ${
                    ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500']
                    [responsibleEmail.charCodeAt(0) % 6]
                  } flex-shrink-0`} />
                  <h3 className="text-sm font-medium text-gray-700">{memberName} s'en occupe ({responsibleItems.length})</h3>
                </div>
                <div className="space-y-1 ml-2">
                  {responsibleItems.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      currentUser={currentUser}
                      colocationMembers={colocationMembers}
                      onTakeResponsibility={handleTakeResponsibility}
                      onMarkPurchased={handleMarkPurchased}
                      onDelete={handleDelete}
                      onEdit={handleEditItem} // Add onEdit prop
                      showResponsiblePerson={false}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-600 mb-2">Aucun article cette semaine</h3>
                <p className="text-sm text-gray-500">Commencez par ajouter des articles à acheter !</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
