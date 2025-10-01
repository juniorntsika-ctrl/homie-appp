import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MessageCircle, Users, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ModernConversationForm({ onSubmit, onCancel, colocataires }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationType, setConversationType] = useState('private');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const steps = [
    { title: "Type", icon: "💬" },
    { title: "Participants", icon: "👥" },
  ];

  const handleSubmit = () => {
    if (conversationType === 'private' && selectedUsers.length === 1) {
      onSubmit('private', selectedUsers, '');
    } else if (conversationType === 'group' && selectedUsers.length > 0) {
      onSubmit('group', selectedUsers, groupName);
    }
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
      case 0: return conversationType;
      case 1: return selectedUsers.length > 0 && (conversationType === 'private' ? selectedUsers.length === 1 : true);
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-3 text-white">
          <button
            onClick={onCancel}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-center">
            <div className="text-xl mb-1">{steps[currentStep].icon}</div>
            <h2 className="text-base font-bold">Nouvelle conversation</h2>
            <p className="text-blue-100 text-xs mt-0.5">{steps[currentStep].title}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1.5 mt-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-t-2xl p-3 min-h-[250px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Step 0: Type de conversation */}
              {currentStep === 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-800 mb-2 block text-center">
                    Quel type de conversation ?
                  </Label>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setConversationType('private')}
                      className={`w-full p-3 rounded-xl text-center transition-all duration-200 ${
                        conversationType === 'private'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <UserPlus className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-medium text-sm">Message privé</div>
                      <div className="text-xs mt-0.5 opacity-80">Conversation avec un colocataire</div>
                    </button>

                    <button
                      onClick={() => setConversationType('group')}
                      className={`w-full p-3 rounded-xl text-center transition-all duration-200 ${
                        conversationType === 'group'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Users className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-medium text-sm">Groupe</div>
                      <div className="text-xs mt-0.5 opacity-80">Discussion à plusieurs</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Participants */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-gray-800 mb-2 block text-center">
                    {conversationType === 'private' ? 'Qui voulez-vous contacter ?' : 'Qui participe au groupe ?'}
                  </Label>

                  {conversationType === 'group' && (
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1 block">
                        Nom du groupe (optionnel)
                      </Label>
                      <Input
                        placeholder="Ex: Discussion appart"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="rounded-xl text-xs h-9"
                      />
                    </div>
                  )}
                  
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {colocataires.map((coloc) => (
                      <div key={coloc.id} className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50">
                        <Checkbox
                          id={coloc.id}
                          checked={selectedUsers.some(u => u.email === coloc.email)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (conversationType === 'private') {
                                setSelectedUsers([coloc]);
                              } else {
                                setSelectedUsers([...selectedUsers, coloc]);
                              }
                            } else {
                              setSelectedUsers(selectedUsers.filter(u => u.email !== coloc.email));
                            }
                          }}
                        />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs">
                          {coloc.full_name?.[0]?.toUpperCase() || coloc.email?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs text-gray-800">{coloc.full_name || coloc.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{coloc.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="rounded-xl px-3 text-xs h-9"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Précédent
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 text-xs h-9"
              >
                Suivant
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 text-xs h-9"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Créer
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}