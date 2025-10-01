import React, { useState } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Key, FileText, Trash2, AlertTriangle } from "lucide-react";

export default function SecuritySection({ currentUser, onBack, onLogout }) {
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Note: This would require a backend endpoint for password change
      alert("Fonctionnalité de changement de mot de passe à venir");
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      alert("Erreur lors du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "⚠️ ATTENTION ⚠️\n\nCette action est IRRÉVERSIBLE et supprimera définitivement :\n- Votre compte\n- Toutes vos données\n- Votre accès à la colocation\n\nTapez 'SUPPRIMER' pour confirmer :"
    );

    if (confirmation === 'SUPPRIMER') {
      try {
        // Note: This would require a backend endpoint for account deletion
        alert("Fonctionnalité de suppression de compte à venir");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression du compte");
      }
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
              <h1 className="text-lg font-bold text-gray-800">Sécurité & Confidentialité</h1>
              <p className="text-sm text-gray-600">Gérez votre sécurité et vos données</p>
            </div>
          </div>

          {/* Password Change */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <Key className="w-4 h-4 text-blue-600" />
                Modification du mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_password" className="text-xs">Mot de passe actuel</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-xl mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="new_password" className="text-xs">Nouveau mot de passe</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-xl mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password" className="text-xs">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-xl mt-1 text-sm"
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password || isChangingPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full text-sm"
              >
                {isChangingPassword ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full rounded-xl justify-start text-sm">
                <FileText className="w-4 h-4 mr-3" />
                Consulter la politique de confidentialité
              </Button>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-0 shadow-lg bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-700">
                ⚠️ Cette action est définitive. Toutes vos données seront supprimées.
              </p>

              <Button
                onClick={handleDeleteAccount}
                variant="destructive"
                className="w-full rounded-xl text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement mon compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}