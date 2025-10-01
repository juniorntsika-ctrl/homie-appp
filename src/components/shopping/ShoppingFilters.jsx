import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, User, ShoppingCart, List } from 'lucide-react';

export default function ShoppingFilters({ activeFilter, onFilterChange, currentUser, stats }) {
  const filters = [
    { id: 'all', label: 'Tous', icon: List, count: stats.total },
    { id: 'my_added', label: 'Mes ajouts', icon: User, count: stats.myAdded },
    { id: 'my_tasks', label: 'Mes achats', icon: ShoppingCart, count: stats.myTasks }
  ];

  return (
    <div className="flex gap-2 p-4 bg-gray-50 rounded-2xl overflow-x-auto">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.id)}
          className="flex items-center gap-2 rounded-2xl whitespace-nowrap"
        >
          <filter.icon className="w-4 h-4" />
          <span>{filter.label}</span>
          <Badge variant="secondary" className="ml-1">
            {filter.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}