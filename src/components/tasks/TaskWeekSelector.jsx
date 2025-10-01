import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TaskWeekSelector({ currentWeek, onWeekChange }) {
  const getWeekDates = (weekString) => {
    const [year, week] = weekString.split('-W');
    const jan4 = new Date(parseInt(year), 0, 4);
    const startDate = startOfWeek(new Date(jan4.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
    return { startDate, endDate };
  };

  const changeWeek = (direction) => {
    const [year, week] = currentWeek.split('-W');
    const currentWeekNum = parseInt(week);
    const currentYear = parseInt(year);
    
    let newWeek, newYear;
    if (direction === 'prev') {
      newWeek = currentWeekNum - 1;
      newYear = currentYear;
      if (newWeek < 1) {
        newWeek = 52;
        newYear = currentYear - 1;
      }
    } else {
      newWeek = currentWeekNum + 1;
      newYear = currentYear;
      if (newWeek > 52) {
        newWeek = 1;
        newYear = currentYear + 1;
      }
    }
    
    onWeekChange(`${newYear}-W${newWeek.toString().padStart(2, '0')}`);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const weekNum = getWeek(now, { weekStartsOn: 1 });
    const year = getYear(now);
    onWeekChange(`${year}-W${weekNum.toString().padStart(2, '0')}`);
  };

  const { startDate, endDate } = getWeekDates(currentWeek);
  const isCurrentWeek = currentWeek === `${getYear(new Date())}-W${getWeek(new Date(), { weekStartsOn: 1 }).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded-2xl shadow-sm border">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => changeWeek('prev')}
        className="rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-base">
            Semaine {currentWeek.split('-W')[1]}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {format(startDate, 'dd MMM', { locale: fr })} - {format(endDate, 'dd MMM yyyy', { locale: fr })}
        </span>
        {!isCurrentWeek && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentWeek}
            className="mt-1 text-xs text-blue-600 hover:text-blue-700 h-auto py-0 px-1"
          >
            Semaine actuelle
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => changeWeek('next')}
        className="rounded-full"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}