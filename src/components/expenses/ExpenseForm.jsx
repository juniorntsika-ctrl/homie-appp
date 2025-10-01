
import React, { useState } from "react";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Euro, FileUp } from "lucide-react";
import { format } from "date-fns"; // Corrected syntax: from "date-fns" instead of = "date-fns"

export default function ExpenseForm({ onSubmit, onCancel, currentUser, colocationMembers }) {
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'courses',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Nouvelle dépense</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Titre</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: Courses Carrefour" 
                className="rounded-xl text-sm" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Montant (€)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                placeholder="0.00" 
                className="rounded-xl text-sm" 
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt" className="flex items-center gap-2 text-sm">
              <FileUp className="w-4 h-4"/>
              Justificatif (obligatoire)
            </Label>
            <Input 
              id="receipt" 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files[0])} 
              required 
              className="rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 text-gray-600 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courses">🛒 Courses</SelectItem>
                  <SelectItem value="factures">⚡ Factures</SelectItem>
                  <SelectItem value="loisirs">🎉 Loisirs</SelectItem>
                  <SelectItem value="transport">🚗 Transport</SelectItem>
                  <SelectItem value="menage">🧽 Ménage</SelectItem>
                  <SelectItem value="autre">💰 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Date</Label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                className="rounded-xl text-sm" 
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              La dépense de <strong>{(parseFloat(formData.amount) || 0).toFixed(2)}€</strong> sera répartie en <strong>{((parseFloat(formData.amount) || 0) / (colocationMembers.length > 0 ? colocationMembers.length : 1)).toFixed(2)}€</strong> pour chacun des <strong>{colocationMembers.length}</strong> colocataires.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="rounded-xl text-sm"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title || !formData.amount || isUploading} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm w-24" 
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Euro className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
