import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Bell, 
  CheckSquare, 
  ShoppingCart, 
  Euro,
  MessageCircle,
  Globe,
  Moon,
  Sun
} from "lucide-react";

export default function NotificationSection({ currentUser, onBack, onUserUpdate }) {
  const [settings, setSettings] = useState({
    notifications_tasks: currentUser?.notifications_tasks ?? true,
    notifications_shopping: currentUser?.notifications_shopping ?? true,
    notifications_expenses: currentUser?.notifications_expenses ?? true,
    notifications_messages: currentUser?.notifications_messages ?? true,
    reminder_frequency: currentUser?.reminder_frequency || 'daily',
    language: currentUser?.language || 'fr',
    theme: currentUser?.theme || 'light'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData(settings);
      onUserUpdate({ ...currentUser, ...settings });
      alert("Préférences mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour des préférences");
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: 'notifications_tasks',
      title: 'Nouvelles tâches',
      description: 'Être notifié des nouvelles tâches assignées',
      icon: CheckSquare,
    },
    {
      key: 'notifications_shopping',
      title: 'Articles ajoutés aux courses',
      description: 'Être notifié des nouveaux articles à acheter',
      icon: ShoppingCart,
    },
    {
      key: 'notifications_expenses',
      title: 'Dépenses enregistrées',
      description: 'Être notifié des nouvelles dépenses',
      icon: Euro,
    },
    {
      key: 'notifications_messages',
      title: 'Messages',
      description: 'Être notifié des nouveaux messages',
      icon: MessageCircle,
    }
  ];

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
              <h1 className="text-lg font-bold text-gray-800">Notifications & Préférences</h1>
              <p className="text-sm text-gray-600">Personnalisez vos notifications et préférences</p>
            </div>
          </div>

          {/* Notifications */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <Bell className="w-4 h-4 text-blue-600" />
                Notifications push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => (
                <div key={type.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{type.title}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[type.key]}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, [type.key]: checked })
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reminder Frequency */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-sm">Fréquence des rappels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-xs">Recevoir des rappels pour les tâches en retard</Label>
              <Select 
                value={settings.reminder_frequency} 
                onValueChange={(value) => setSettings({ ...settings, reminder_frequency: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="never">Jamais</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-blue-600" />
                Langue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-xs">Langue de l'application</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                {settings.theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-blue-600" />
                ) : (
                  <Sun className="w-4 h-4 text-blue-600" />
                )}
                Thème
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-xs">Apparence de l'application</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Clair</SelectItem>
                  <SelectItem value="dark">🌙 Sombre</SelectItem>
                  <SelectItem value="auto">⚡ Automatique</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button onClick={onBack} variant="outline" className="rounded-xl text-sm">
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 text-sm"
            >
              {isSaving ? (
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