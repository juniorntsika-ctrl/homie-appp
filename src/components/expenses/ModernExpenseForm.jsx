
import React, { useState } from "react";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Euro, FileUp, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ModernExpenseForm({ onSubmit, onCancel, currentUser, colocationMembers }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'courses',
    date: new Date().toISOString().split('T')[0],
  });

  const steps = [
    { title: "Informations", icon: "💰" },
    { title: "Catégorie", icon: "🏷️" },
    { title: "Justificatif", icon: "📄" }
  ];

  const handleSubmit = async () => {
    if (!receiptFile) {
      alert("Veuillez ajouter un justificatif.");
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file: receiptFile });

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
          alert("Veuillez saisir un montant valide.");
          setIsUploading(false);
          return;
      }
      
      const participants = colocationMembers.map(member => ({
        email: member.email,
        amount_owed: member.email === currentUser.email ? 0 : amount / colocationMembers.length
      }));

      const month_year = format(new Date(formData.date), 'yyyy-MM');

      const finalData = {
        ...formData,
        amount,
        paid_by: currentUser.email,
        colocation_id: currentUser.colocation_id,
        receipt_url: file_url,
        split_equally: true,
        participants,
        type: 'ponctuelle',
        month_year,
      };
      
      onSubmit(finalData);

    } catch (error) {
      console.error("Erreur lors de l'envoi du justificatif", error);
      alert("Une erreur est survenue lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
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
      case 0: return formData.title && formData.amount;
      case 1: return formData.category;
      case 2: return receiptFile;
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
            <h2 className="text-lg font-bold">Nouvelle dépense</h2>
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
                      Que voulez-vous enregistrer ?
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Ex: Courses Carrefour"
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Combien avez-vous dépensé ?
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                        className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 pr-10"
                      />
                      <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Date de la dépense
                    </Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Catégorie */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-800 mb-3 block text-center">
                    Dans quelle catégorie ?
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'courses', label: 'Courses', icon: '🛒', color: 'from-green-400 to-green-500' },
                      { value: 'factures', label: 'Factures', icon: '⚡', color: 'from-orange-400 to-orange-500' },
                      { value: 'loisirs', label: 'Loisirs', icon: '🎉', color: 'from-pink-400 to-pink-500' },
                      { value: 'transport', label: 'Transport', icon: '🚗', color: 'from-blue-400 to-blue-500' },
                      { value: 'menage', label: 'Ménage', icon: '🧽', color: 'from-purple-400 to-purple-500' },
                      { value: 'autre', label: 'Autre', icon: '💰', color: 'from-gray-400 to-gray-500' }
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
                </div>
              )}

              {/* Step 2: Justificatif */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Ajoutez votre justificatif
                    </Label>
                    <p className="text-gray-500 text-xs">
                      Photo du ticket, facture PDF...
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    {receiptFile ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FileUp className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="font-medium text-green-600 text-sm">{receiptFile.name}</p>
                        <button
                          onClick={() => setReceiptFile(null)}
                          className="text-xs text-gray-500 hover:text-red-500"
                        >
                          Changer le fichier
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <FileUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="font-medium text-gray-700 text-sm mb-1">Sélectionner un fichier</p>
                        <p className="text-xs text-gray-500">Images, PDF acceptés</p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setReceiptFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {formData.amount && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-700 text-center">
                        <span className="font-bold">{(parseFloat(formData.amount) || 0).toFixed(2)}€</span> répartis en{' '}
                        <span className="font-bold">{((parseFloat(formData.amount) || 0) / (colocationMembers.length > 0 ? colocationMembers.length : 1)).toFixed(2)}€</span>{' '}
                        par personne ({colocationMembers.length} colocataires)
                      </p>
                    </div>
                  )}
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
                disabled={!canProceed() || isUploading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6"
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Euro className="w-4 h-4 mr-2" />
                )}
                Créer
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
