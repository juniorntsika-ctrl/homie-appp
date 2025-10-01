import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Euro, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function RecentActivity({ title, items, type, emptyMessage }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      courses: 'bg-green-100 text-green-700 border-green-200',
      factures: 'bg-orange-100 text-orange-700 border-orange-200',
      menage: 'bg-blue-100 text-blue-700 border-blue-200',
      equipement: 'bg-purple-100 text-purple-700 border-purple-200',
      sorties: 'bg-pink-100 text-pink-700 border-pink-200',
      transport: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          {type === 'tasks' ? (
            <CheckSquare className="w-6 h-6 text-blue-500" />
          ) : (
            <Euro className="w-6 h-6 text-purple-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              {type === 'tasks' ? (
                <CheckSquare className="w-8 h-8 text-gray-400" />
              ) : (
                <Euro className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                  type === 'tasks' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {type === 'tasks' ? (
                    <CheckSquare className="w-5 h-5 text-white" />
                  ) : (
                    <Euro className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {item.title}
                    </h4>
                    {type === 'tasks' ? (
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'completed' ? 'Terminé' : 
                         item.status === 'in_progress' ? 'En cours' : 'À faire'}
                      </Badge>
                    ) : (
                      <Badge className={getCategoryColor(item.category)}>
                        {item.amount}€
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {type === 'tasks' ? (
                      <>
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {format(new Date(item.due_date), 'dd MMM', { locale: fr })}
                        </span>
                        {item.assigned_to && (
                          <>
                            <User className="w-3 h-3 text-gray-400 ml-2" />
                            <span className="text-xs text-gray-500">
                              {item.assigned_to?.split('@')[0]}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Payé par {item.paid_by?.split('@')[0]}
                        </span>
                        <span className="text-xs text-gray-400 mx-1">•</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(item.date), 'dd MMM', { locale: fr })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}