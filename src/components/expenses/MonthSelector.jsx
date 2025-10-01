import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MonthSelector({ currentMonth, onMonthChange }) {
  const changeMonth = (direction) => {
    const currentDate = new Date(currentMonth + '-02'); // Use day 02 to avoid timezone issues
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
    onMonthChange(format(newDate, 'yyyy-MM'));
  };

  const goToCurrentMonth = () => {
    onMonthChange(format(new Date(), 'yyyy-MM'));
  };

  const displayDate = new Date(currentMonth + '-02');
  const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM');

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded-2xl shadow-sm border">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => changeMonth('prev')}
        className="rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex flex-col items-center text-center">
        <span className="font-semibold text-base capitalize">
          {format(displayDate, 'MMMM yyyy', { locale: fr })}
        </span>
        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="mt-1 text-xs text-blue-600 hover:text-blue-700 h-auto py-0 px-1"
          >
            Mois actuel
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => changeMonth('next')}
        className="rounded-full"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}