
import React, { useState, useEffect } from "react";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, ShoppingCart, ChevronLeft, ChevronRight, Camera, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ModernShoppingForm({ item, onSubmit, onCancel, currentUser, currentWeek }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    brand: '',
    is_urgent: false,
    image_url: '',
    estimated_price: '',
    category: 'autre'
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        quantity: item.quantity || '',
        brand: item.brand || '',
        is_urgent: item.is_urgent || false,
        image_url: item.image_url || '',
        estimated_price: item.estimated_price ? item.estimated_price.toString() : '',
        category: item.category || 'autre'
      });
    }
  }, [item]);

  const steps = [
    { title: "Article", icon: "🛒" },
    { title: "Détails", icon: "📝" },
    { title: "Visuel", icon: "📸" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalImageUrl = formData.image_url;
    
    // Upload image if file was selected
    if (imageFile) {
      setIsUploading(true);
      try {
        const { file_url } = await UploadFile({ file: imageFile });
        finalImageUrl = file_url;
      } catch (error) {
        console.error("Erreur lors du téléchargement de l'image", error);
        alert("Erreur lors du téléchargement de l'image");
        setIsUploading(false);
        return;
      }
    }
    
    const finalData = {
      ...formData,
      image_url: finalImageUrl,
      estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null,
      colocation_id: currentUser.colocation_id,
      added_by: currentUser.email,
      week_year: currentWeek,
      ...(item && { id: item.id }) // Include item ID if editing an existing item
    };
    
    onSubmit(finalData);
    setIsUploading(false);
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
      case 0: return formData.name.trim();
      case 1: return true; // Les détails sont optionnels
      case 2: return true; // Le visuel est optionnel
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
            <h2 className="text-lg font-bold">{item ? "Modifier l'article" : "Ajouter un article"}</h2>
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
              {/* Step 0: Article de base */}
              {currentStep === 0 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Nom de l'article
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Lait, Pain, Pommes..."
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Quantité (optionnel)
                    </Label>
                    <Input
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="Ex: 1kg, 2 packs, 6 unités..."
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50">
                    <div>
                      <Label className="text-sm font-semibold text-gray-800">Achat urgent</Label>
                      <p className="text-xs text-gray-500">Article à acheter en priorité</p>
                    </div>
                    <Switch
                      checked={formData.is_urgent}
                      onCheckedChange={(checked) => setFormData({...formData, is_urgent: checked})}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Détails */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Marque préférée (optionnel)
                    </Label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="Ex: Carrefour, Leclerc..."
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                      Prix estimé (optionnel)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.estimated_price}
                      onChange={(e) => setFormData({...formData, estimated_price: e.target.value})}
                      placeholder="0.00"
                      className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Visuel */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="text-sm font-semibold text-gray-800 mb-2 block">
                      Lien ou Image (optionnel)
                    </Label>
                    <p className="text-gray-500 text-xs">
                      Aidez vos colocataires à s'y retrouver
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Link className="w-3 h-3" />
                        Lien du produit
                      </Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://exemple.com/produit"
                        className="text-xs p-2.5 rounded-lg border border-gray-300 focus:border-blue-400"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">ou</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        Prendre/Télécharger une photo
                      </Label>
                      
                      {imageFile ? (
                        <div className="p-3 rounded-lg border border-green-300 bg-green-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-green-700">{imageFile.name}</span>
                            <Button
                              type="button"
                              onClick={() => setImageFile(null)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 h-auto p-1"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-center">
                            <Camera className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Cliquez pour choisir une image</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
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
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {item ? "Modifier" : "Ajouter"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
