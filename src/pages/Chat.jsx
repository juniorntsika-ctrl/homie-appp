
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Trash2, // Added Trash2 import
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ModernConversationForm from "../components/chat/ModernConversationForm";

export default function ChatListPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [colocataires, setColocataires] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.colocation_id) {
        const conversationsData = await Conversation.filter({ colocation_id: user.colocation_id }, '-last_message_date');
        setConversations(conversationsData);

        const colocatairesData = await User.filter({ colocation_id: user.colocation_id });
        setColocataires(colocatairesData.filter(c => c.email !== user.email));
        
        // Suppression de la création automatique du chat de groupe
        // The previous logic for creating a default 'group' conversation has been removed as per the request.
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteConversation = async (conversationId) => {
    if (confirm("Voulez-vous vraiment supprimer cette conversation ? Cette action est irréversible et supprimera également tous les messages associés.")) {
      try {
        // Supprimer tous les messages de la conversation
        // Filter messages by conversation_id to delete only relevant messages.
        const messages = await Message.filter({ conversation_id: conversationId });
        for (const msg of messages) {
          await Message.delete(msg.id);
        }
        
        // Supprimer la conversation
        await Conversation.delete(conversationId);
        
        // Reload data to reflect the changes
        loadData();
      } catch (error) {
        console.error("Erreur lors de la suppression de la conversation:", error);
        alert("Une erreur est survenue lors de la suppression de la conversation.");
      }
    }
  };

  const createNewConversation = async (type, selectedUsers, groupName) => {
    try {
      let newConversation;
      
      if (type === 'private' && selectedUsers.length === 1) {
        const otherUser = selectedUsers[0];
        const existingConversation = conversations.find(c => 
          c.type === 'private' && 
          c.participants.includes(otherUser.email) && 
          c.participants.includes(currentUser.email)
        );

        if (existingConversation) {
          window.location.href = createPageUrl(`Conversation?id=${existingConversation.id}`);
          return;
        }

        newConversation = await Conversation.create({
          name: `${currentUser.full_name || 'Vous'} & ${otherUser.full_name || 'Colocataire'}`,
          type: "private",
          colocation_id: currentUser.colocation_id,
          participants: [currentUser.email, otherUser.email]
        });
      } else if (type === 'group' && selectedUsers.length > 0) { // Condition updated to > 0 as per outline
        newConversation = await Conversation.create({
          name: groupName || `Groupe de ${selectedUsers.length + 1}`,
          type: "group",
          colocation_id: currentUser.colocation_id,
          participants: [currentUser.email, ...selectedUsers.map(u => u.email)]
        });
      }

      if (newConversation) {
        setShowNewConversation(false);
        window.location.href = createPageUrl(`Conversation?id=${newConversation.id}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Groupe';
    }
    
    const otherParticipant = conversation.participants.find(p => p !== currentUser?.email);
    const member = colocataires.find(m => m.email === otherParticipant);
    return member?.first_name || member?.full_name?.split(' ')[0] || otherParticipant?.split('@')[0] || 'Inconnu';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <Users className="w-6 h-6 text-white" />
        </div>
      );
    } else {
      const otherParticipant = conversation.participants.find(p => p !== currentUser?.email);
      const otherUser = colocataires.find(c => c.email === otherParticipant);
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
          {otherUser?.first_name?.[0]?.toUpperCase() || otherParticipant?.[0]?.toUpperCase() || 'U'}
        </div>
      );
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-gray-800">Messages</h1>
          
          <Button 
            size="icon" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-10 w-10"
            onClick={() => setShowNewConversation(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content avec padding pour le top bar fixe */}
      <div className="pt-20 pb-20 lg:pb-8 flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 rounded-full border-gray-200 bg-gray-100 h-11"
            />
          </div>

          {/* Liste des conversations */}
          <div className="space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune conversation</h3>
                <p className="text-gray-500 text-sm">Cliquez sur '+' pour en démarrer une.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 rounded-2xl hover:bg-gray-100 transition-colors group relative"
                >
                  <Link
                    to={createPageUrl(`Conversation?id=${conversation.id}`)}
                    className="flex items-center gap-3"
                  >
                    {getConversationAvatar(conversation)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-base text-gray-800 truncate">
                          {getConversationName(conversation)}
                        </h3>
                        {conversation.last_message_date && (
                          <span className="text-[12px] text-gray-500 flex items-center">
                            {getTimeAgo(conversation.last_message_date)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {conversation.last_message_content ? (
                          <p className="text-sm text-gray-500 truncate">
                            <span className="font-medium text-gray-600">
                              {conversation.last_message_sender === currentUser?.email 
                                ? 'Vous: ' 
                                : ''
                              }
                            </span>
                            {conversation.last_message_content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Aucun message</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  {/* Bouton supprimer visible au survol */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigating to conversation page
                      e.stopPropagation(); // Stop event from propagating to the parent Link
                      deleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modern Conversation Form */}
      {showNewConversation && (
        <ModernConversationForm
          onSubmit={createNewConversation}
          onCancel={() => setShowNewConversation(false)}
          colocataires={colocataires}
          currentUserEmail={currentUser?.email} // Pass current user email for filtering/display logic within the form
        />
      )}
    </div>
  );
}
