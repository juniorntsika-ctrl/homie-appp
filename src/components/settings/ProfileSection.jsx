import React, { useState } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, User as UserIcon, Phone } from "lucide-react";

export default function ProfileSection({ currentUser, onBack, onUserUpdate }) {
  const [formData, setFormData] = useState({
    full_name: currentUser?.full_name || '',
    first_name: currentUser?.first_name || '',
    last_name: currentUser?.last_name || '',
    phone: currentUser?.phone || '',
    avatar_url: currentUser?.avatar_url || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    setIsUploading(true);
    try {
      let finalAvatarUrl = formData.avatar_url;
      
      if (avatarFile) {
        const { file_url } = await UploadFile({ file: avatarFile });
        finalAvatarUrl = file_url;
      }

      const updatedData = {
        ...formData,
        avatar_url: finalAvatarUrl,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
      };
      
      await User.updateMyUserData(updatedData);
      onUserUpdate({ ...currentUser, ...updatedData });
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="rounded-full bg-white shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Profil utilisateur</h1>
              <p className="text-sm text-gray-600">Gérez vos informations personnelles</p>
            </div>
          </div>

          {/* Avatar Section */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Photo de profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {formData.avatar_url || avatarFile ? (
                    <img
                      src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar_url}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {formData.first_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{`${formData.first_name} ${formData.last_name}`.trim() || 'Votre nom'}</h3>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-sm">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-xs">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Votre prénom"
                    className="rounded-xl mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-xs">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Votre nom"
                    className="rounded-xl mt-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
                  <Phone className="w-4 h-4" />
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className="rounded-xl mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Information */}
          <Card className="border-0 shadow-lg bg-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-gray-800">Adresse email</h3>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <Button variant="outline" disabled className="rounded-xl text-xs">
                  Non modifiable
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Votre email est utilisé pour la connexion et ne peut pas être modifié.
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button onClick={onBack} variant="outline" className="rounded-xl text-sm">
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isUploading || !formData.first_name || !formData.last_name}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 text-sm"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}