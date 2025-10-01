
import React from 'react';
import { Button } from '@/components/ui/button';

export default function TaskFilterBar({ currentFilter, onFilterChange }) {
    const filters = [
        { key: 'all', label: 'Toutes les tâches' },
        { key: 'mine', label: 'Mes tâches' },
        { key: 'completed', label: 'Terminées' },
    ];

    return (
        <div className="flex justify-center gap-2">
            {filters.map(filter => (
                <Button
                    key={filter.key}
                    onClick={() => onFilterChange(filter.key)}
                    variant={currentFilter === filter.key ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-full shadow-sm text-xs ${currentFilter === filter.key ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-700'}`}
                >
                    {filter.label}
                </Button>
            ))}
        </div>
    );
}
