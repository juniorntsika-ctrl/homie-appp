
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, PieChart as PieIcon, ArrowRightLeft, Share } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; // Removed Legend from import
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#64748b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm p-2 border rounded-lg shadow-lg">
        {/* For PieChart, payload[0].name is usually the category name. label is often undefined. */}
        <p className="font-medium text-gray-800 mb-1">{payload[0].name}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {/* entry.percent is provided by recharts for Pie slices */}
            {`${entry.name} : ${entry.value.toFixed(2)}€ (${(entry.percent * 100).toFixed(1)}%)`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ExpenseStats({ expenses, colocationMembers, currentMonth }) {
    const [selectedColocDetails, setSelectedColocDetails] = useState(null);

    const stats = useMemo(() => {
        const filteredExpenses = expenses;
        
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Stats par catégorie
        const categoryStats = filteredExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});
        
        const categoryLabels = { 
            courses: 'Courses', 
            factures: 'Factures', 
            loisirs: 'Loisirs', 
            transport: 'Transport', 
            menage: 'Ménage', 
            autre: 'Autre' 
        };
        
        // Process categories to limit to top 3 + 'Autre'
        let rawPieChartData = Object.entries(categoryStats).map(([key, value]) => ({
            name: categoryLabels[key] || 'Autre',
            value: value,
        }));

        // Sort by value in descending order
        rawPieChartData.sort((a, b) => b.value - a.value);

        const topCategories = rawPieChartData.slice(0, 3);
        const otherCategories = rawPieChartData.slice(3);

        let otherAmount = otherCategories.reduce((sum, item) => sum + item.value, 0);

        let pieChartData = topCategories.map(item => ({
            ...item,
            percentage: totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : 0
        }));

        if (otherAmount > 0) {
            pieChartData.push({
                name: 'Autre',
                value: otherAmount,
                percentage: totalExpenses > 0 ? ((otherAmount / totalExpenses) * 100).toFixed(1) : 0
            });
        }

        // Stats par colocataire avec historique détaillé
        const balances = {};
        colocationMembers.forEach(member => {
            balances[member.email] = { 
                paid: 0, 
                owes: 0, 
                net: 0, 
                name: member.full_name?.split(' ')[0] || member.email.split('@')[0],
                paidFor: {},
                owesTo: {}
            };
        });
        
        filteredExpenses.forEach(expense => {
            if (balances[expense.paid_by]) {
                balances[expense.paid_by].paid += expense.amount;
            }
            // Ensure colocationMembers is not empty to avoid division by zero
            const amountPerPerson = expense.amount / (colocationMembers.length || 1);
            
            colocationMembers.forEach(member => {
                if (balances[member.email] && member.email !== expense.paid_by) {
                    balances[member.email].owes += amountPerPerson;
                    
                    if (!balances[expense.paid_by].paidFor[member.email]) {
                        balances[expense.paid_by].paidFor[member.email] = 0;
                    }
                    balances[expense.paid_by].paidFor[member.email] += amountPerPerson;
                    
                    if (!balances[member.email].owesTo[expense.paid_by]) {
                        balances[member.email].owesTo[expense.paid_by] = 0;
                    }
                    balances[member.email].owesTo[expense.paid_by] += amountPerPerson;
                }
            });
        });
        
        Object.keys(balances).forEach(email => {
            balances[email].net = balances[email].paid - balances[email].owes;
        });

        return { totalExpenses, pieChartData, balances };
    }, [expenses, colocationMembers]);

    const handleShare = async () => {
        const displayMonth = format(new Date(currentMonth + '-02'), 'MMMM yyyy', { locale: fr });
        const shareText = `📊 Statistiques de dépenses - ${displayMonth}\n\n💰 Total des dépenses : ${stats.totalExpenses.toFixed(2)}€\n\n📈 Répartition par catégorie :\n${stats.pieChartData.map(item => `• ${item.name} : ${item.value.toFixed(2)}€ (${item.percentage}%)`).join('\n')}\n\n👥 Soldes des colocataires :\n${Object.values(stats.balances).map(balance => `• ${balance.name} : ${balance.net >= 0 ? '+' : ''}${balance.net.toFixed(2)}€`).join('\n')}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Statistiques - ${displayMonth}`,
                    text: shareText
                });
            } catch (error) {
                console.log('Partage annulé', error);
            }
        } else {
            // Fallback pour les navigateurs qui ne supportent pas l'API de partage
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Statistiques copiées dans le presse-papiers !');
            }).catch(() => {
                alert('Impossible de copier les statistiques');
            });
        }
    };

    const showColocDetails = (balance) => {
        setSelectedColocDetails(balance);
    };

    // Si aucune dépense, afficher un message
    if (expenses.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Button onClick={handleShare} variant="outline" size="sm" className="rounded-xl text-xs">
                        <Share className="w-3 h-3 mr-1" />
                        Partager
                    </Button>
                </div>
                
                <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="p-8 text-center">
                        <PieIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune dépense ce mois-ci</h3>
                        <p className="text-gray-500">Commencez par ajouter vos premières dépenses pour voir les statistiques apparaître ici.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleShare} variant="outline" size="sm" className="rounded-xl text-xs">
                    <Share className="w-3 h-3 mr-1" />
                    Partager
                </Button>
            </div>

            {/* Répartition par catégorie */}
            <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                        <PieIcon className="w-5 h-5 text-purple-600" />
                        Répartition par catégorie
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.pieChartData.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucune donnée de catégorie disponible</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Graphique circulaire seul */}
                            <div className="h-48 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={stats.pieChartData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={70} 
                                            fill="#8884d8"
                                            labelLine={false}
                                        >
                                            {stats.pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Légende séparée en dessous */}
                            <div className="space-y-2">
                                {stats.pieChartData.map((entry, index) => (
                                    <div key={entry.name} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded" 
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="font-medium text-sm text-gray-700">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">{entry.percentage}%</Badge>
                                            <span className="font-bold text-sm text-gray-800">{entry.value.toFixed(2)}€</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Historique détaillé par colocataire */}
            <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                        <Users className="w-5 h-5 text-green-600" />
                        Soldes par colocataire
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {Object.values(stats.balances).length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucune donnée de solde disponible</p>
                        </div>
                    ) : (
                        Object.values(stats.balances).map((balance, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => showColocDetails(balance)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                        ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500', 'bg-orange-500'][index % 5]
                                    }`}>
                                        {balance.name[0]}
                                    </div>
                                    <span className="font-semibold text-sm">{balance.name}</span>
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <div className="text-center">
                                        <p className="text-gray-500 font-medium">A payé</p>
                                        <p className="font-bold text-green-600">{balance.paid.toFixed(2)}€</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-500 font-medium">Doit</p>
                                        <p className="font-bold text-red-600">{balance.owes.toFixed(2)}€</p>
                                    </div>
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-gray-500 font-medium">Solde</p>
                                        <p className={`font-bold text-sm ${balance.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {balance.net >= 0 ? '+' : ''}{balance.net.toFixed(2)}€
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Modal des détails colocataire */}
            {selectedColocDetails && (
                <Dialog open={!!selectedColocDetails} onOpenChange={() => setSelectedColocDetails(null)}>
                    <DialogContent className="rounded-2xl max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                                Détails pour {selectedColocDetails.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-green-600 text-sm">💰 {selectedColocDetails.name} a payé pour :</h4>
                                    {Object.entries(selectedColocDetails.paidFor).length > 0 ? (
                                        Object.entries(selectedColocDetails.paidFor).map(([email, amount]) => {
                                            const member = colocationMembers.find(m => m.email === email);
                                            const memberName = member?.full_name?.split(' ')[0] || email.split('@')[0];
                                            return (
                                                <div key={email} className="flex justify-between items-center p-2 rounded-lg bg-green-50">
                                                    <span className="text-xs font-medium">{memberName}</span>
                                                    <Badge className="bg-green-600 text-white text-xs">{amount.toFixed(2)}€</Badge>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-xs">N'a payé pour personne.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-red-600 text-sm">💳 {selectedColocDetails.name} doit à :</h4>
                                    {Object.entries(selectedColocDetails.owesTo).length > 0 ? (
                                        Object.entries(selectedColocDetails.owesTo).map(([email, amount]) => {
                                            const member = colocationMembers.find(m => m.email === email);
                                            const memberName = member?.full_name?.split(' ')[0] || email.split('@')[0];
                                            return (
                                                <div key={email} className="flex justify-between items-center p-2 rounded-lg bg-red-50">
                                                    <span className="text-xs font-medium">{memberName}</span>
                                                    <Badge className="bg-red-600 text-white text-xs">{amount.toFixed(2)}€</Badge>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-xs">Ne doit rien à personne.</p>
                                    )}
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl text-center ${selectedColocDetails.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className={`text-lg font-bold ${selectedColocDetails.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Solde net: {selectedColocDetails.net >= 0 ? '+' : ''}{selectedColocDetails.net.toFixed(2)}€
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
