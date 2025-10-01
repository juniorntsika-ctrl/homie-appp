
import React, { useState } from "react";
import { User } from "@/api/entities";
import { Colocation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Home, 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Plus,
  MapPin,
  Crown,
  UserMinus,
  LogOut,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ColocationSection({ 
  currentUser, 
  colocation, 
  colocationMembers, 
  onBack, 
  onDataRefresh 
}) {
  const [copied, setCopied] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [colocationForm, setColocationForm] = useState({
    name: '',
    address: '',
    invite_code: ''
  });

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateColocation = async () => {
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
      
      alert("Colocation créée avec succès !");
      onDataRefresh();
      setShowCreateForm(false);
      setColocationForm({ name: '', address: '', invite_code: '' });
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la colocation");
    }
  };

  const handleJoinColocation = async () => {
    try {
      const colocationData = await Colocation.filter({ 
        invite_code: colocationForm.invite_code.toUpperCase() 
      });
      
      if (colocationData.length > 0) {
        await User.updateMyUserData({ colocation_id: colocationData[0].id });
        alert("Vous avez rejoint la colocation !");
        onDataRefresh();
        setShowJoinForm(false);
        setColocationForm({ name: '', address: '', invite_code: '' });
      } else {
        alert("Code d'invitation invalide");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      alert("Erreur lors de la connexion à la colocation");
    }
  };

  const handleLeaveColocation = async () => {
    if (confirm("Êtes-vous sûr de vouloir quitter cette colocation ?")) {
      try {
        await User.updateMyUserData({ colocation_id: null });
        alert("Vous avez quitté la colocation");
        onDataRefresh();
      } catch (error) {
        console.error("Erreur lors de la sortie:", error);
        alert("Erreur lors de la sortie de la colocation");
      }
    }
  };

  const copyInviteCode = () => {
    if (colocation?.invite_code) {
      navigator.clipboard.writeText(colocation.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAvatarColor = (email) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
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
              <h1 className="text-lg font-bold text-gray-800">Colocation</h1>
              <p className="text-sm text-gray-600">Gérez vos colocations et colocataires</p>
            </div>
          </div>

          {colocation ? (
            <>
              {/* Colocation Info */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-sm">
                    <Home className="w-4 h-4 text-blue-600" />
                    {colocation.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {colocation.address && (
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{colocation.address}</span>
                    </div>
                  )}

                  {/* Invite Code */}
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">Code d'invitation</p>
                        <p className="text-xl font-bold text-blue-600">{colocation.invite_code}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyInviteCode}
                        className="rounded-xl"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Partagez ce code pour inviter de nouveaux colocataires
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Members */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      Colocataires ({colocationMembers.length})
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {colocationMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(member.email)} flex items-center justify-center text-white font-semibold shadow-lg`}>
                        {member.first_name?.[0]?.toUpperCase() || member.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{member.first_name || member.full_name?.split(' ')[0] || member.email.split('@')[0]}</p>
                          {member.email === colocation.created_by && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 flex items-center gap-1 text-xs">
                              <Crown className="w-3 h-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Actions for admin */}
                      {currentUser.email === colocation.created_by && member.email !== currentUser.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-3 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une nouvelle colocation
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-4">
                    <Button
                      onClick={handleLeaveColocation}
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Quitter cette colocation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* No Colocation */}
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-gray-800 mb-2">Aucune colocation</h3>
                    <p className="text-sm text-gray-500">Créez ou rejoignez une colocation pour commencer</p>
                  </div>
                </CardContent>
              </Card>

              {/* Create/Join Options */}
              <div className="space-y-3">
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl py-3 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une colocation
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-4">
                    <Button
                      onClick={() => setShowJoinForm(true)}
                      variant="outline"
                      className="w-full rounded-xl py-3 border-2 text-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Rejoindre une colocation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Create Form Modal */}
          <AnimatePresence>
            {showCreateForm && (
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
                      onClick={() => setShowCreateForm(false)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏠</div>
                      <h2 className="text-lg font-bold">Créer une colocation</h2>
                      <p className="text-blue-100 text-sm mt-0.5">Informations de base</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white rounded-t-2xl p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Nom de la colocation *</Label>
                        <Input
                          value={colocationForm.name}
                          onChange={(e) => setColocationForm({ ...colocationForm, name: e.target.value })}
                          placeholder="Coloc Rue de Lille"
                          className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Adresse (optionnel)</Label>
                        <Input
                          value={colocationForm.address}
                          onChange={(e) => setColocationForm({ ...colocationForm, address: e.target.value })}
                          placeholder="123 Rue de Lille, Paris"
                          className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          onClick={() => setShowCreateForm(false)} 
                          variant="outline" 
                          className="rounded-xl text-sm"
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleCreateColocation} 
                          disabled={!colocationForm.name} 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm"
                        >
                          Créer
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Join Form Modal */}
          <AnimatePresence>
            {showJoinForm && (
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
                      onClick={() => setShowJoinForm(false)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔗</div>
                      <h2 className="text-lg font-bold">Rejoindre une colocation</h2>
                      <p className="text-blue-100 text-sm mt-0.5">Code d'invitation</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white rounded-t-2xl p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Code d'invitation *</Label>
                        <Input
                          value={colocationForm.invite_code}
                          onChange={(e) => setColocationForm({ ...colocationForm, invite_code: e.target.value })}
                          placeholder="ABC123"
                          className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 uppercase font-semibold tracking-widest text-center"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          onClick={() => setShowJoinForm(false)} 
                          variant="outline" 
                          className="rounded-xl text-sm"
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleJoinColocation} 
                          disabled={!colocationForm.invite_code} 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm"
                        >
                          Rejoindre
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
