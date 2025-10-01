import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Home, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ColocataireProfil({ member, isOpen, onClose }) {
  if (!member) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-xs p-0 overflow-hidden">
        <div className={`relative bg-gradient-to-br ${getAvatarColor(member.email)} p-4 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col items-center text-center">
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.first_name || member.full_name || 'Avatar'}
                className="w-16 h-16 rounded-full border-3 border-white/30 shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-3 border-white/30 shadow-lg bg-white/20 flex items-center justify-center text-2xl font-bold">
                {member.first_name?.[0]?.toUpperCase() || member.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            
            <h2 className="text-lg font-bold mt-3">
              {member.first_name && member.last_name
                ? `${member.first_name} ${member.last_name}`
                : member.full_name || 'Colocataire'}
            </h2>
            
            {member.role === 'admin' && (
              <div className="mt-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-medium">
                Administrateur
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="space-y-2">
            {member.email && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500">Email</p>
                  <p className="text-xs font-medium text-gray-900 truncate">{member.email}</p>
                </div>
              </div>
            )}

            {member.phone && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500">Téléphone</p>
                  <p className="text-xs font-medium text-gray-900">{member.phone}</p>
                </div>
              </div>
            )}

            {member.date_of_birth && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500">Date de naissance</p>
                  <p className="text-xs font-medium text-gray-900">
                    {format(new Date(member.date_of_birth), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            )}

            {member.created_date && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Home className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500">Membre depuis</p>
                  <p className="text-xs font-medium text-gray-900">
                    {format(new Date(member.created_date), 'MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1.5">
            {member.phone && (
              <Button
                onClick={() => window.location.href = `tel:${member.phone}`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-9"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" />
                Appeler
              </Button>
            )}
            {member.email && (
              <Button
                onClick={() => window.location.href = `mailto:${member.email}`}
                variant="outline"
                className="flex-1 rounded-xl text-xs h-9"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}