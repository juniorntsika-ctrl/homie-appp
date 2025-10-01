
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Colocation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  User as UserIcon,
  Home,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Settings as SettingsIcon
} from "lucide-react";

import ProfileSection from "@/components/settings/ProfileSection";
import ColocationSection from "@/components/settings/ColocationSection";
import NotificationSection from "@/components/settings/NotificationSection";
import SecuritySection from "@/components/settings/SecuritySection";
import SupportSection from "@/components/settings/SupportSection";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [colocation, setColocation] = useState(null);
  const [colocationMembers, setColocationMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.colocation_id) {
        try {
          const [colocationData, membersData] = await Promise.all([
            Colocation.filter({ id: user.colocation_id }),
            User.filter({ colocation_id: user.colocation_id })
          ]);

          if (colocationData.length > 0) {
            setColocation(colocationData[0]);
          }
          setColocationMembers(membersData);
        } catch (colocationError) {
          console.log("Erreur lors du chargement de la colocation:", colocationError);
        }
      }
    } catch (error) {
      console.log("Erreur lors du chargement de l'utilisateur:", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl("index"));
      window.location.reload();
    } catch (error) {
      console.log("Erreur lors de la déconnexion:", error);
    }
  };

  const settingSections = [
    {
      key: 'profile',
      title: 'Profil utilisateur',
      description: 'Gérez vos informations personnelles',
      icon: UserIcon,
    },
    {
      key: 'colocation',
      title: 'Colocation',
      description: 'Paramètres de votre colocation',
      icon: Home,
    },
    {
      key: 'notifications',
      title: 'Notifications & préférences',
      description: 'Gérez vos notifications et préférences',
      icon: Bell,
    },
    {
      key: 'security',
      title: 'Sécurité & confidentialité',
      description: 'Mot de passe et données personnelles',
      icon: Shield,
    },
    {
      key: 'support',
      title: 'Support & aide',
      description: 'FAQ, contact et signalements',
      icon: HelpCircle,
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Vue section active
  if (activeSection) {
    const SectionComponent = {
      profile: ProfileSection,
      colocation: ColocationSection,
      notifications: NotificationSection,
      security: SecuritySection,
      support: SupportSection
    }[activeSection];

    return (
      <SectionComponent
        currentUser={currentUser}
        colocation={colocation}
        colocationMembers={colocationMembers}
        onBack={() => setActiveSection(null)}
        onUserUpdate={setCurrentUser}
        onDataRefresh={loadUserData}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-lg font-bold text-gray-800">Paramètres</h1>
                <p className="text-sm text-gray-600">Gérez votre profil et vos préférences</p>
             </div>
          </div>

          {/* Profile Quick View */}
          {currentUser && (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br from-blue-500 to-blue-600`}>
                    {currentUser.first_name?.[0]?.toUpperCase() || currentUser.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {currentUser.first_name && currentUser.last_name
                        ? `${currentUser.first_name} ${currentUser.last_name}`
                        : currentUser.full_name || 'Utilisateur'
                      }
                    </h3>
                  </div>
                  <Button
                    onClick={() => setActiveSection('profile')}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 text-xs"
                  >
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Sections */}
          <div className="space-y-2">
            {settingSections.filter(section => section.key !== 'profile').map((section) => (
              <Card
                key={section.key}
                className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setActiveSection(section.key)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <section.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-800">{section.title}</h3>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Logout */}
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-3">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
              >
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
