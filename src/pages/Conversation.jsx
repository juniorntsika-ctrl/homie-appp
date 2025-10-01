
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { User } from "@/api/entities";
import { Message } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Send, Paperclip, Camera, Plus, X, BarChart3, Phone, Video, Trash2, Mic } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion"; // Added framer-motion import
import ColocataireProfil from "@/components/conversation/ColocataireProfil"; // Added ColocataireProfil import

export default function ConversationPage() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [colocationMembers, setColocationMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showColocataireProfil, setShowColocataireProfil] = useState(false); // Added showColocataireProfil state
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const conversationId = new URLSearchParams(location.search).get('id');

  const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯', '✅', '❌'];

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [convData] = await Conversation.filter({ id: conversationId });
      setConversation(convData);

      const messagesData = await Message.filter({ conversation_id: conversationId }, 'created_date');
      setMessages(messagesData);
      
      if (user.colocation_id) {
        const membersData = await User.filter({ colocation_id: user.colocation_id });
        setColocationMembers(membersData);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId, loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await Message.create({
        content: newMessage,
        sender: currentUser.email,
        conversation_id: conversationId,
        colocation_id: currentUser.colocation_id,
        type: 'message'
      });

      await Conversation.update(conversationId, {
        last_message_content: newMessage,
        last_message_date: new Date().toISOString(),
        last_message_sender: currentUser.email
      });

      setNewMessage('');
      loadData();
    } catch (error) {
      console.error("Erreur d'envoi:", error);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      
      await Message.create({
        content: type === 'image' ? '📷 Image' : `📎 ${file.name}`,
        sender: currentUser.email,
        conversation_id: conversationId,
        colocation_id: currentUser.colocation_id,
        type: type,
        file_url: file_url,
        file_name: file.name,
        file_type: file.type
      });

      await Conversation.update(conversationId, {
        last_message_content: type === 'image' ? '📷 Image' : `📎 Fichier`,
        last_message_date: new Date().toISOString(),
        last_message_sender: currentUser.email
      });

      loadData();
    } catch (error) {
      console.error("Erreur d'upload:", error);
    }
  };

  const createPoll = async () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
      alert("Veuillez saisir une question et au moins 2 options");
      return;
    }

    try {
      await Message.create({
        content: pollQuestion,
        sender: currentUser.email,
        conversation_id: conversationId,
        colocation_id: currentUser.colocation_id,
        type: 'poll',
        poll_options: pollOptions.filter(o => o.trim()),
        poll_votes: []
      });

      await Conversation.update(conversationId, {
        last_message_content: `📊 Sondage: ${pollQuestion}`,
        last_message_date: new Date().toISOString(),
        last_message_sender: currentUser.email
      });

      setShowPollDialog(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      loadData();
    } catch (error) {
      console.error("Erreur de création du sondage:", error);
    }
  };

  const voteOnPoll = async (message, option) => {
    const existingVote = message.poll_votes?.find(v => v.voter === currentUser.email);
    
    let newVotes = message.poll_votes || [];
    if (existingVote) {
      newVotes = newVotes.filter(v => v.voter !== currentUser.email);
    }
    newVotes.push({ voter: currentUser.email, option });

    try {
      await Message.update(message.id, { poll_votes: newVotes });
      loadData();
    } catch (error) {
      console.error("Erreur de vote:", error);
    }
  };

  const addReaction = async (message, emoji) => {
    const reactions = message.reactions || [];
    const existingReaction = reactions.find(r => r.user_email === currentUser.email);

    let newReactions;
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        newReactions = reactions.filter(r => r.user_email !== currentUser.email);
      } else {
        newReactions = reactions.map(r => 
          r.user_email === currentUser.email ? { ...r, emoji } : r
        );
      }
    } else {
      newReactions = [...reactions, { user_email: currentUser.email, emoji }];
    }

    try {
      await Message.update(message.id, { reactions: newReactions });
      setShowReactionPicker(null);
      loadData();
    } catch (error) {
      console.error("Erreur de réaction:", error);
    }
  };

  const handleTouchStart = (message) => {
    const timer = setTimeout(() => {
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDoubleClick = (message) => {
    setShowReactionPicker(message.id);
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  const deleteMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      await Message.delete(selectedMessage.id);
      setShowMessageMenu(false);
      setSelectedMessage(null);
      loadData();
    } catch (error) {
      console.error("Erreur de suppression:", error);
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return '';
    if (conversation.type === 'group') {
      return conversation.name || 'Groupe';
    }
    
    const otherParticipant = conversation.participants?.find(p => p !== currentUser?.email);
    const member = colocationMembers.find(m => m.email === otherParticipant);
    return member?.first_name || member?.full_name?.split(' ')[0] || otherParticipant?.split('@')[0] || 'Conversation';
  };

  const getOtherMemberAvatar = () => {
    if (!conversation || conversation.type === 'group') return null;
    const otherParticipant = conversation.participants?.find(p => p !== currentUser?.email);
    const member = colocationMembers.find(m => m.email === otherParticipant);
    return member;
  };

  const getAvatarColor = (email) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
    if (!email) return 'bg-gray-500';
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const otherMember = getOtherMemberAvatar();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Chat")}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            {otherMember && (
              <button 
                onClick={() => setShowColocataireProfil(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(otherMember.email)} hover:scale-105 transition-transform cursor-pointer`}
              >
                {otherMember.first_name?.[0]?.toUpperCase() || otherMember.full_name?.[0]?.toUpperCase() || 'U'}
              </button>
            )}
            <div>
              <h1 className="font-semibold text-base">{getConversationTitle()}</h1>
              {conversation?.type === 'group' && (
                <p className="text-xs text-gray-500">{conversation.participants?.length} participants</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Phone className="w-5 h-5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Video className="w-5 h-5 text-blue-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex-1 pt-16 ${showQuickActions ? 'pb-40' : 'pb-16'} overflow-y-auto transition-all duration-300`}>
        <div className="p-4 space-y-3">
          {messages.map((message) => {
            const isMyMessage = message.sender === currentUser?.email;
            const senderName = message.sender?.split('@')[0] || 'Utilisateur';

            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                onTouchStart={() => handleTouchStart(message)}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={() => handleDoubleClick(message)}
                onContextMenu={(e) => handleContextMenu(e, message)}
              >
                <div className={`max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col gap-1 relative`}>
                  {!isMyMessage && conversation?.type === 'group' && (
                    <span className="text-xs text-gray-500 px-2">{senderName}</span>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-2 ${isMyMessage ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} shadow-sm`}>
                    {message.type === 'image' && message.file_url && (
                      <img src={message.file_url} alt="Image" className="rounded-lg max-w-full mb-2" />
                    )}
                    {message.type === 'file' && message.file_url && (
                      <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{message.file_name || 'Fichier'}</span>
                      </a>
                    )}
                    {message.type === 'poll' && (
                      <div className="space-y-2 min-w-[200px]">
                        <p className="font-semibold text-sm">{message.content}</p>
                        {message.poll_options?.map((option, idx) => {
                          const votes = message.poll_votes?.filter(v => v.option === option).length || 0;
                          const totalVotes = message.poll_votes?.length || 0;
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                          const hasVoted = message.poll_votes?.some(v => v.voter === currentUser.email && v.option === option);

                          return (
                            <button
                              key={idx}
                              onClick={() => voteOnPoll(message, option)}
                              className={`w-full text-left p-2 rounded-lg transition-all ${hasVoted ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                            >
                              <div className="flex justify-between items-center text-sm">
                                <span>{option}</span>
                                <span className="font-semibold">{votes}</span>
                              </div>
                              <div className="w-full bg-gray-300 rounded-full h-1 mt-1">
                                <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </button>
                          );
                        })}
                        <p className="text-xs text-gray-500 mt-1">{message.poll_votes?.length || 0} vote(s)</p>
                      </div>
                    )}
                    {message.type === 'message' && <p className="text-sm">{message.content}</p>}
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1">
                        {[...new Set(message.reactions.map(r => r.emoji))].map(emoji => {
                          const count = message.reactions.filter(r => r.emoji === emoji).length;
                          return (
                            <span key={emoji} className="text-xs bg-white rounded-full px-1.5 py-0.5 shadow-sm border">
                              {emoji} {count}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(message.created_date), 'HH:mm', { locale: fr })}
                    </span>
                  </div>

                  {showReactionPicker === message.id && (
                    <div className="absolute bottom-full mb-2 bg-white rounded-2xl shadow-xl p-2 flex gap-1 z-50 border">
                      {availableEmojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(message, emoji)}
                          className="text-xl hover:scale-125 transition-transform p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowReactionPicker(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showQuickActions && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <Camera className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-gray-700">Caméra</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <Paperclip className="w-6 h-6 text-purple-600" />
              <span className="text-xs text-gray-700">Fichier</span>
            </button>
            <button onClick={() => setShowPollDialog(true)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <span className="text-xs text-gray-700">Sondage</span>
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="rounded-full"
          >
            {showQuickActions ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message..."
            className="flex-1 rounded-full border-gray-300 text-sm"
          />
          <Button
            onClick={sendMessage}
            size="icon"
            disabled={!newMessage.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {showPollDialog && (
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
                onClick={() => setShowPollDialog(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <h2 className="text-lg font-bold">Créer un sondage</h2>
                <p className="text-blue-100 text-sm mt-0.5">Posez votre question</p>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-t-2xl p-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Question</Label>
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Quelle est votre question ?"
                    className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Options</Label>
                  <div className="space-y-2">
                    {pollOptions.map((option, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...pollOptions];
                            newOptions[idx] = e.target.value;
                            setPollOptions(newOptions);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="text-sm p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500"
                        />
                        {idx > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                            className="rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-2 w-full text-xs rounded-xl"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Ajouter une option
                  </Button>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPollDialog(false)} 
                    className="text-sm rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={createPoll} 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm rounded-xl"
                  >
                    Créer
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showMessageMenu && selectedMessage && (
        <Dialog open={showMessageMenu} onOpenChange={setShowMessageMenu}>
          <DialogContent className="rounded-2xl max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-base">Actions</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setShowReactionPicker(selectedMessage.id);
                  setShowMessageMenu(false);
                }}
                variant="ghost"
                className="w-full justify-start"
              >
                😊 Réagir au message
              </Button>
              {selectedMessage.sender === currentUser?.email && (
                <Button
                  onClick={deleteMessage}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Supprimer
                </Button>
              )}
              <Button
                onClick={() => setShowMessageMenu(false)}
                variant="outline"
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Profil Colocataire */}
      {otherMember && (
        <ColocataireProfil
          member={otherMember}
          isOpen={showColocataireProfil}
          onClose={() => setShowColocataireProfil(false)}
        />
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'file')} />
      <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e.target.files[0], 'image')} />
    </div>
  );
}
