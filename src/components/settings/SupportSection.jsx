
import React, { useState } from "react";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  HelpCircle, 
  Mail, 
  Bug,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function SupportSection({ currentUser, onBack }) {
  const [contactForm, setContactForm] = useState({
    type: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSendMessage = async () => {
    if (!contactForm.type || !contactForm.subject || !contactForm.message) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setIsSending(true);
    try {
      await SendEmail({
        to: "support@homie-app.com",
        subject: `[${contactForm.type}] ${contactForm.subject}`,
        body: `De: ${currentUser.full_name} (${currentUser.email})\n\nType: ${contactForm.type}\n\nMessage:\n${contactForm.message}`
      });
      
      alert("Votre message a été envoyé ! Nous vous répondrons dans les plus brefs délais.");
      setContactForm({ type: '', subject: '', message: '' });
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSending(false);
    }
  };

  const faqItems = [
    {
      question: "Comment inviter un nouveau colocataire ?",
      answer: "Allez dans Paramètres > Colocation, copiez le code d'invitation et partagez-le avec votre nouveau colocataire. Il pourra rejoindre votre colocation en saisissant ce code."
    },
    {
      question: "Comment répartir une dépense différemment ?",
      answer: "Actuellement, les dépenses sont automatiquement réparties équitablement entre tous les colocataires. La répartition personnalisée sera disponible dans une future mise à jour."
    },
    {
      question: "Puis-je modifier une tâche après l'avoir créée ?",
      answer: "Oui, vous pouvez modifier une tâche en appuyant sur les trois points à côté de la tâche et en sélectionnant 'Modifier'."
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Allez dans Paramètres > Sécurité & confidentialité > Zone de danger. Attention, cette action est irréversible !"
    },
    {
      question: "Comment confirmer un remboursement ?",
      answer: "Lorsqu'un colocataire vous envoie un paiement, vous recevrez une notification dans l'onglet Dépenses. Cliquez sur la carte orange 'Paiements en attente' pour confirmer ou refuser le paiement."
    }
  ];

  const contactTypes = [
    { value: 'support', label: 'Support technique', icon: '🛠️' },
    { value: 'bug', label: 'Signaler un bug', icon: '🐛' },
    { value: 'suggestion', label: "Suggestion d'amélioration", icon: '💡' },
    { value: 'other', label: 'Autre', icon: '💬' }
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
              <h1 className="text-lg font-bold text-gray-800">Support & Aide</h1>
              <p className="text-sm text-gray-600">FAQ, contact et signalements</p>
            </div>
          </div>

          {/* FAQ */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Questions fréquentes (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {faqItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-sm text-gray-800">{item.question}</span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="p-3 pt-0 bg-gray-50">
                      <p className="text-sm text-gray-700">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                Contacter le support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Type de demande</Label>
                <Select 
                  value={contactForm.type} 
                  onValueChange={(value) => setContactForm({ ...contactForm, type: value })}
                >
                  <SelectTrigger className="rounded-xl mt-1 text-sm">
                    <SelectValue placeholder="Sélectionnez le type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-sm">
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject" className="text-xs">Sujet</Label>
                <Input
                  id="subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Résumé de votre demande"
                  className="rounded-xl mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-xs">Message</Label>
                <Textarea
                  id="message"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Décrivez votre problème ou suggestion en détail..."
                  className="rounded-xl mt-1 h-28 text-sm"
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={isSending || !contactForm.type || !contactForm.subject || !contactForm.message}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Envoyer le message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
