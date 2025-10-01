
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckSquare, Square, Clock, Repeat, Edit, User, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TaskCard({ task, member, onStatusChange, onMenuAction }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const getAvatarColor = (email) => {
        const colors = ['bg-blue-200 text-blue-800', 'bg-purple-200 text-purple-800', 'bg-pink-200 text-pink-800', 'bg-green-200 text-green-800', 'bg-orange-200 text-orange-800', 'bg-red-200 text-red-800'];
        if (!email) return 'bg-gray-200 text-gray-800';
        const index = email.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const statusConfig = {
        todo: { icon: <Square className="w-5 h-5 text-gray-400" />, label: 'À faire', color: 'bg-gray-100 text-gray-800' },
        in_progress: { icon: <CheckSquare className="w-5 h-5 text-blue-500 animate-pulse" />, label: 'En cours', color: 'bg-blue-100 text-blue-800' },
        completed: { icon: <CheckSquare className="w-5 h-5 text-blue-600" />, label: 'Terminé', color: 'bg-blue-100 text-blue-800' },
    };

    const isLate = isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed';

    const cardBgColor = () => {
        if (task.status === 'completed') return 'bg-blue-50/50';
        if (isLate) return 'bg-red-50/80';
        return 'bg-white';
    };

    return (
        <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${cardBgColor()}`}>
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex-shrink-0">{statusConfig[task.status].icon}</button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onStatusChange(task, 'todo')}>À faire</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, 'in_progress')}>En cours</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task, 'completed')}>Terminé</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex-1 space-y-1.5 min-w-0">
                        <h3 className={`font-semibold text-sm text-gray-800 truncate ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {isLate && (
                                <Badge className="bg-red-100 text-red-600 border border-red-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    En retard
                                </Badge>
                            )}
                            {task.status === 'completed' ? (
                                <Badge className="bg-blue-600 text-white">{statusConfig[task.status].label}</Badge>
                            ) : task.status !== 'todo' && (
                                <Badge className={statusConfig[task.status].color}>{statusConfig[task.status].label}</Badge>
                            )}
                            {task.category === 'menage' && task.room && <Badge variant="outline">{task.room.replace(/_/g, ' ')}</Badge>}
                            <div className={`flex items-center gap-1 text-xs ${isLate ? 'text-red-600' : 'text-gray-500'}`}>
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(task.due_date), 'dd MMM', { locale: fr })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 ml-2">
                         {member ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(member.email)}`}>
                                {member.first_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 md:flex hidden"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onMenuAction('edit', task)}><Edit className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onMenuAction('reassign', task)}><User className="w-4 h-4 mr-2" /> Réassigner</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onMenuAction('delete', task)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
