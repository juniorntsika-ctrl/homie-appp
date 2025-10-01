import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { Colocation } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Home, UserPlus } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState(null); // null initialement
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [colocationForm, setColocationForm] = useState({
    name: '',
    address: '',
    invite_code: ''
  });

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Si l'utilisateur a déjà une colocation, rediriger vers Synthese
        if (user.colocation_id) {
          navigate(createPageUrl("Synthese"));
          return;
        }
        
        // Utilisateur connecté mais pas de colocation -> choix
        setOnboardingStep(1);
      } catch (error) {
        // Pas connecté -> écran bienvenue
        setOnboardingStep(0);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      // Rediriger vers la page actuelle pour revenir après login
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateColocation = async () => {
    if (!colocationForm.name) {
      alert("Veuillez saisir un nom pour la colocation");
      return;
    }

    try {
      const inviteCode = generateInviteCode();
      const colocationData = {
        name: colocationForm.name,
        address: colocationForm.address,
        invite_code: inviteCode,
        created_by: currentUser.email
      };
      
      const newColocation = await Colocation.create(colocationData);
      await User.updateMyUserData({ colocation_id: newColocation.id });
      
      navigate(createPageUrl("Synthese"));
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la colocation");
    }
  };

  const handleJoinColocation = async () => {
    if (!colocationForm.invite_code || colocationForm.invite_code.length < 6) {
      alert("Veuillez saisir un code d'invitation valide");
      return;
    }

    try {
      const colocationData = await Colocation.filter({ 
        invite_code: colocationForm.invite_code.toUpperCase() 
      });
      
      if (colocationData.length > 0) {
        await User.updateMyUserData({ colocation_id: colocationData[0].id });
        navigate(createPageUrl("Synthese"));
      } else {
        alert("Code d'invitation invalide");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      alert("Erreur lors de la connexion à la colocation");
    }
  };

  // Écran de chargement avec fond bleu
  if (isCheckingAuth || onboardingStep === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#1436ff' }}>
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white tracking-tight" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '700'
          }}>
            homie
          </h1>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Écran de bienvenue
  if (onboardingStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#1436ff' }}>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
        
        <div className="max-w-2xl w-full text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '700'
            }}>
              homie
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-blue-100 text-base md:text-lg leading-relaxed">
                Simplifiez la gestion de votre colocation avec vos colocataires
              </p>
            </div>

            <div className="space-y-3 mt-10">
              <Button 
                onClick={handleLogin}
                className="w-full max-w-sm mx-auto bg-white hover:bg-gray-100 text-blue-600 rounded-2xl py-4 text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Choix créer/rejoindre
  if (onboardingStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#1436ff' }}>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-white tracking-tight" style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: '700'
              }}>
                homie
              </h1>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Votre colocation</h2>
            <p className="text-blue-100">Créez une nouvelle colocation ou rejoignez-en une</p>
          </div>

          <div className="space-y-4">
            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all cursor-pointer" onClick={() => setOnboardingStep(2)}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Créer une colocation</h3>
                    <p className="text-sm text-gray-500">Vous êtes le premier à vous installer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all cursor-pointer" onClick={() => setOnboardingStep(3)}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Rejoindre une colocation</h3>
                    <p className="text-sm text-gray-500">Vous avez un code d'invitation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Créer une colocation
  if (onboardingStep === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#1436ff' }}>
        <div className="max-w-md w-full relative z-10">
          <Button 
            onClick={() => setOnboardingStep(1)}
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>

          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-4xl mb-3">🏠</div>
                <h2 className="text-2xl font-bold">Créer votre colocation</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Nom de la colocation *</Label>
                <Input
                  value={colocationForm.name}
                  onChange={(e) => setColocationForm({ ...colocationForm, name: e.target.value })}
                  placeholder="Ex: Appart Rue de Lille"
                  className="mt-2 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Adresse (optionnel)</Label>
                <Input
                  value={colocationForm.address}
                  onChange={(e) => setColocationForm({ ...colocationForm, address: e.target.value })}
                  placeholder="123 Rue de Lille, Paris"
                  className="mt-2 rounded-xl"
                />
              </div>

              <Button
                onClick={handleCreateColocation}
                disabled={!colocationForm.name}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 mt-6"
              >
                Créer ma colocation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Rejoindre une colocation
  if (onboardingStep === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#1436ff' }}>
        <div className="max-w-md w-full relative z-10">
          <Button 
            onClick={() => setOnboardingStep(1)}
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Button>

          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="text-4xl mb-3">🔗</div>
                <h2 className="text-2xl font-bold">Rejoindre une colocation</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Code d'invitation *</Label>
                <Input
                  value={colocationForm.invite_code}
                  onChange={(e) => setColocationForm({ ...colocationForm, invite_code: e.target.value })}
                  placeholder="ABC123"
                  className="mt-2 rounded-xl uppercase text-center text-lg font-bold tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Demandez le code d'invitation à un membre de votre colocation
                </p>
              </div>

              <Button
                onClick={handleJoinColocation}
                disabled={!colocationForm.invite_code || colocationForm.invite_code.length < 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 mt-6"
              >
                Rejoindre
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}