
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Event } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin,
  X,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    end_date: '',
    location: '',
    type: 'autre'
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.colocation_id) {
        const eventsData = await Event.filter({ colocation_id: user.colocation_id }, 'date');
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    try {
      await Event.create({
        ...formData,
        colocation_id: currentUser.colocation_id,
        participants: [currentUser.email]
      });
      setFormData({
        title: '',
        description: '',
        date: '',
        end_date: '',
        location: '',
        type: 'autre'
      });
      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      soiree: 'bg-pink-100 text-pink-700 border-pink-200',
      sortie: 'bg-purple-100 text-purple-700 border-purple-200',
      menage: 'bg-blue-100 text-blue-700 border-blue-200',
      courses: 'bg-green-100 text-green-700 border-green-200',
      rendez_vous: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'soiree': return '🎉';
      case 'sortie': return '🚀';
      case 'menage': return '🧽';
      case 'courses': return '🛒';
      case 'rendez_vous': return '📅';
      default: return '📋';
    }
  };

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.date) < new Date());

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">Calendrier</h1>
            <p className="text-gray-600">Planifiez les événements de votre colocation</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        {showForm && (
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Créer un nouvel événement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'événement</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Soirée pizza"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails de l'événement..."
                  className="rounded-xl h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date et heure de début</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date et heure de fin</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type d'événement</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soiree">🎉 Soirée</SelectItem>
                      <SelectItem value="sortie">🚀 Sortie</SelectItem>
                      <SelectItem value="menage">🧽 Ménage</SelectItem>
                      <SelectItem value="courses">🛒 Courses</SelectItem>
                      <SelectItem value="rendez_vous">📅 Rendez-vous</SelectItem>
                      <SelectItem value="autre">📋 Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Lieu de l'événement"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-2xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.date}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Créer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Événements à venir</h2>
            <div className="grid gap-6">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{getTypeIcon(event.type)}</div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-xl text-gray-800">{event.title}</h3>
                          {event.description && (
                            <p className="text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                          {event.participants && (
                            <Badge variant="outline" className="border-gray-300">
                              <Users className="w-3 h-3 mr-1" />
                              {event.participants.length} participant(s)
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(event.date), 'EEEE dd MMM yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Events */}
        {events.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun événement</h3>
              <p className="text-gray-500">Commencez par créer votre premier événement !</p>
            </CardContent>
          </Card>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Événements passés</h2>
            <div className="grid gap-4">
              {pastEvents.slice(0, 3).map((event) => (
                <Card key={event.id} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl opacity-60">{getTypeIcon(event.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-700">{event.title}</h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
