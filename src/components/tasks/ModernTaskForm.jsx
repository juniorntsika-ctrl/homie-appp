
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, CheckSquare, ChevronLeft, ChevronRight, Calendar, Dices } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ModernTaskForm({ task, onSubmit, onCancel, members }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(task || {
    title: '', description: '', assigned_to: '', room: 'generale',
    frequency: 'unique', due_date: '', priority: 'medium', category: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
    }
  }, [task]);

  const steps = [
    { title: "Informations", icon: "📝" },
    { title: "Catégorie", icon: "🏷️" },
    { title: "Attribution", icon: "👤" }
  ];

  const assignRandomly = () => {
    if (members.length > 0) {
      const randomMember = members[Math.floor(Math.random() * members.length)];
      setFormData({...formData, assigned_to: randomMember.email });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.title;
      case 1: return formData.category;
      case 2: return formData.assigned_to;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-4 text-white">
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-center">
            <div className="text-2xl mb-1">{steps[currentStep].icon}</div>
            <h2 className="text-lg font-bold">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
            <p className="text-blue-100 text-sm mt-0.5">{steps[currentStep].title}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1.5 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-t-2xl p-4 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Step 0: Informations de base */}
              {currentStep === 0 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Titre de la tâche
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Nettoyer la cuisine"
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Description (optionnel)
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Détails de la tâche..."
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 h-20"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Date limite (optionnel)
                    </Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Catégorie */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block text-center">
                    Quelle catégorie ?
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'menage', label: 'Ménage', icon: '🧽', color: 'from-blue-400 to-blue-500' },
                      { value: 'administratif', label: 'Administratif', icon: '📋', color: 'from-purple-400 to-purple-500' },
                      { value: 'courses', label: 'Courses', icon: '🛒', color: 'from-green-400 to-green-500' },
                      { value: 'autre', label: 'Autre', icon: '🔧', color: 'from-gray-400 to-gray-500' }
                    ].map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setFormData({...formData, category: category.value})}
                        className={`p-3 rounded-xl text-white font-semibold transition-all duration-200 ${
                          formData.category === category.value
                            ? `bg-gradient-to-br ${category.color} scale-105 shadow-lg`
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{category.icon}</div>
                        <div className="text-xs">{category.label}</div>
                      </button>
                    ))}
                  </div>

                  {formData.category === 'menage' && (
                    <div className="mt-3">
                      <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                        Quelle pièce ?
                      </Label>
                      <Select value={formData.room} onValueChange={v => setFormData({...formData, room: v})}>
                        <SelectTrigger className="rounded-xl text-sm">
                          <SelectValue placeholder="Choisir une pièce..."/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cuisine">Cuisine</SelectItem>
                          <SelectItem value="salon">Salon</SelectItem>
                          <SelectItem value="salle_de_bain">Salle de bain</SelectItem>
                          <SelectItem value="wc">WC</SelectItem>
                          <SelectItem value="chambre">Chambre</SelectItem>
                          <SelectItem value="exterieur">Extérieur</SelectItem>
                          <SelectItem value="generale">Générale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Attribution */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block text-center">
                    Qui s'en occupe ?
                  </Label>
                  
                  <div className="space-y-2">
                    {members.map(member => {
                      const firstName = member.full_name?.split(' ')[0] || member.email.split('@')[0];
                      return (
                        <button
                          key={member.id}
                          onClick={() => setFormData({...formData, assigned_to: member.email})}
                          className={`w-full p-3 rounded-xl text-center transition-all duration-200 ${
                            formData.assigned_to === member.email
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="font-medium text-sm">{firstName}</div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={assignRandomly}
                    className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400"
                  >
                    <Dices className="w-4 h-4 mr-2" />
                    Attribution aléatoire
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="rounded-xl px-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {task ? 'Modifier' : 'Créer'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
