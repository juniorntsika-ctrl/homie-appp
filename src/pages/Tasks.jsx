
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { Task } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, CheckSquare, Dices, Calendar } from "lucide-react";
import { getWeek, getYear } from 'date-fns';
import TaskCard from "@/components/tasks/TaskCard";
import TaskFilterBar from "@/components/tasks/TaskFilterBar";
import TaskWeekSelector from "@/components/tasks/TaskWeekSelector";
import ModernTaskForm from "@/components/tasks/ModernTaskForm";

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [reassigningTask, setReassigningTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Semaine actuelle par défaut
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
        const [tasksData, membersData] = await Promise.all([
          Task.filter({ colocation_id: user.colocation_id, week_year: currentWeek }, '-due_date'),
          User.filter({ colocation_id: user.colocation_id })
        ]);
        setTasks(tasksData);
        setMembers(membersData);
      } else {
        // Handle case where user is not part of a colocation
        setTasks([]);
        setMembers([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      // Potentially redirect to setup page if user has no colocation and API returns error for filter
    }
    setIsLoading(false);
  }, [currentWeek]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleShowForm = (task = null) => {
      setEditingTask(task);
      setShowForm(true);
  }

  const handleSubmit = async (formData) => {
    try {
      const dataToSubmit = { 
        ...formData, 
        week_year: currentWeek,
        colocation_id: currentUser.colocation_id 
      };
      
      if (!dataToSubmit.due_date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dataToSubmit.due_date = tomorrow.toISOString().split('T')[0];
      }

      if (editingTask) {
        await Task.update(editingTask.id, dataToSubmit);
      } else {
        await Task.create(dataToSubmit);
      }
      setShowForm(false);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await Task.update(task.id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };
  
  const handleMenuAction = (action, task) => {
      if (action === 'edit') {
          handleShowForm(task);
      } else if (action === 'delete') {
          if (confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
              Task.delete(task.id).then(loadData);
          }
      } else if (action === 'reassign') {
          setReassigningTask(task);
      }
  };

  const handleReassign = async (newAssigneeEmail) => {
      if (!reassigningTask) return;
      try {
          await Task.update(reassigningTask.id, { assigned_to: newAssigneeEmail });
          setReassigningTask(null);
          loadData();
      } catch (error) {
          console.error("Erreur lors de la réassignation:", error);
      }
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'mine') {
      return tasks.filter(t => t.assigned_to === currentUser?.email);
    }
    if (filter === 'completed') {
      return tasks.filter(t => t.status === 'completed');
    }
    return tasks.filter(t => t.status !== 'completed');
  }, [tasks, filter, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Tâches</h1>
            <p className="text-gray-600">Gérez les corvées de votre colocation</p>
          </div>
          <Button onClick={() => handleShowForm()} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-10 w-10">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {!(showForm || editingTask) && <TaskWeekSelector currentWeek={currentWeek} onWeekChange={setCurrentWeek} />}

        {(showForm || editingTask) && 
            <ModernTaskForm 
                task={editingTask} 
                onSubmit={handleSubmit} 
                onCancel={() => { setShowForm(false); setEditingTask(null); }}
                members={members}
            />
        }

        <TaskFilterBar currentFilter={filter} onFilterChange={setFilter} />

        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const member = members.find(m => m.email === task.assigned_to);
              return (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  member={member} 
                  onStatusChange={handleStatusChange} 
                  onMenuAction={handleMenuAction} 
                />
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-400"/>
                <p>Aucune tâche à afficher pour cette semaine.</p>
            </div>
          )}
        </div>
        
        {reassigningTask && (
            <Dialog open={!!reassigningTask} onOpenChange={() => setReassigningTask(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Réassigner la tâche</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                        {members.map(member => (
                            <Button key={member.id} variant="outline" className="w-full justify-start" onClick={() => handleReassign(member.email)}>
                                {member.full_name}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </div>
    </div>
  );
}
