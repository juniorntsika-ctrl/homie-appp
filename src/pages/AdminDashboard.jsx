
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Colocation } from "@/api/entities";
import { Expense } from "@/api/entities";
import { ShoppingItem } from "@/api/entities";
import { Task } from "@/api/entities"; // Added Task entity import
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'; // Added PieChart, Pie, Cell, Legend
import { Users, Home, Euro, ShoppingCart, TrendingUp, ShieldCheck, Activity, Users as UsersIcon, DollarSign, PieChart as PieIcon, Tag } from "lucide-react"; // Added Activity, UsersIcon, DollarSign, PieIcon, Tag
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

// Constants for chart styling and category labels
const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#64748b', '#ef4444', '#f59e0b', '#14b8a6', '#a855f7', '#eab308']; // More colors for categories

const categoryLabels = {
    courses: 'Courses',
    factures: 'Factures',
    loisirs: 'Loisirs',
    transport: 'Transport',
    menage: 'Ménage',
    autre: 'Autre'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const user = await User.me();
        if (!user || user.role !== 'admin') {
          navigate(createPageUrl("Synthese"));
          return;
        }

        // Fetch all necessary data, including Tasks
        const [users, colocations, expenses, shoppingItems, tasks] = await Promise.all([
          User.list(),
          Colocation.list(),
          Expense.list(),
          ShoppingItem.list(),
          Task.list() // Fetch tasks
        ]);

        // KPIs principaux
        const totalUsers = users.length;
        const totalColocations = colocations.length;
        const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        // New KPI: Average users per colocation
        const avgUsersPerColoc = totalColocations > 0 ? (totalUsers / totalColocations).toFixed(1) : 0;

        // --- Analyse d'Usage ---
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentExpenses = expenses.filter(i => new Date(i.created_date) > thirtyDaysAgo).length;
        const recentTasks = tasks.filter(i => new Date(i.created_date) > thirtyDaysAgo).length;
        const recentShopping = shoppingItems.filter(i => new Date(i.created_date) > thirtyDaysAgo).length;

        const colocsWithExpenses = new Set(expenses.map(i => i.colocation_id));
        const colocsWithTasks = new Set(tasks.map(i => i.colocation_id));
        const colocsWithShopping = new Set(shoppingItems.map(i => i.colocation_id));

        const expenseAdoptionRate = totalColocations > 0 ? (colocsWithExpenses.size / totalColocations) * 100 : 0;
        const taskAdoptionRate = totalColocations > 0 ? (colocsWithTasks.size / totalColocations) * 100 : 0;
        const shoppingAdoptionRate = totalColocations > 0 ? (colocsWithShopping.size / totalColocations) * 100 : 0;

        // --- Analyse de Consommation ---
        const expenseByCategory = expenses.reduce((acc, exp) => {
            const categoryKey = exp.category ? exp.category.toLowerCase() : 'autre'; // Handle potential null/empty category
            acc[categoryKey] = (acc[categoryKey] || 0) + exp.amount;
            return acc;
        }, {});
        const expenseByCategoryData = Object.entries(expenseByCategory)
            .map(([name, total]) => ({ name: categoryLabels[name] || name.charAt(0).toUpperCase() + name.slice(1), total })) // Use labels or format
            .sort((a,b) => b.total - a.total);

        const necessaryCats = ['courses', 'factures', 'transport', 'menage'];
        const leisureCats = ['loisirs'];
        let necessaryTotal = 0;
        let leisureTotal = 0;
        let otherTotal = 0;
        expenses.forEach(exp => {
            const categoryKey = exp.category ? exp.category.toLowerCase() : 'autre';
            if(necessaryCats.includes(categoryKey)) necessaryTotal += exp.amount;
            else if(leisureCats.includes(categoryKey)) leisureTotal += exp.amount;
            else otherTotal += exp.amount;
        });
        const budgetSplitData = [
            { name: 'Essentiel', value: necessaryTotal },
            { name: 'Loisirs', value: leisureTotal },
            { name: 'Autre', value: otherTotal }
        ];

        // --- Insights & Monétisation ---
        const recurringKeywords = ['netflix', 'spotify', 'amazon', 'prime', 'disney', 'canal', 'free', 'sfr', 'orange', 'bouygues', 'edf', 'totalenergies', 'engie', 'gym', 'salle']; // Added more keywords
        const serviceCounts = recurringKeywords.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
        expenses.forEach(exp => {
            const title = exp.title ? exp.title.toLowerCase() : ''; // Handle potential null/empty title
            recurringKeywords.forEach(key => {
                if(title.includes(key)) serviceCounts[key]++;
            });
        });
        const topServices = Object.entries(serviceCounts)
            .filter(([, count]) => count > 0)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));


        // Removed topShoppingItems and userGrowthData calculation as per new outline
        // const shoppingItemCounts = shoppingItems.reduce((acc, item) => { ... });
        // const topShoppingItems = Object.entries(shoppingItemCounts).sort(...);
        // const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
        // const userGrowthData = last30Days.map(day => ({ ... }));

        setStats({
          totalUsers,
          totalColocations,
          totalExpensesAmount,
          avgUsersPerColoc, // Added
          recentActivity: { expenses: recentExpenses, tasks: recentTasks, shopping: recentShopping }, // Added
          adoptionRates: { expenses: expenseAdoptionRate, tasks: taskAdoptionRate, shopping: shoppingAdoptionRate }, // Added
          expenseByCategoryData, // Added
          budgetSplitData, // Added
          topServices, // Added
          // topShoppingItems, // Removed
          // userGrowthData // Removed
        });

      } catch (error) {
        console.error("Erreur de chargement des données admin:", error);
        navigate(createPageUrl("Synthese"));
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8 space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="w-10 h-10 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord Administrateur</h1>
            <p className="text-gray-600">Vision stratégique et analyse des données consolidées</p> {/* Updated description */}
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"> {/* Changed to 4 columns */}
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Utilisateurs</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Colocations</CardTitle><Home className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalColocations}</div></CardContent></Card>
          {/* New KPI: Average users per colocation */}
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Moy. / Coloc</CardTitle><UsersIcon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgUsersPerColoc}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Volume Dépenses</CardTitle><Euro className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalExpensesAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div></CardContent></Card>
        </div>

        {/* Usages & Consommation Section */}
        <div className="space-y-2 mb-8"><h2 className="text-xl font-semibold text-gray-700">Usages & Consommation</h2><hr/></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* New Card: Fréquence d'ajouts (30j) */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Fréquence d'ajouts (30j)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center"><span className="font-medium">Dépenses</span><span className="font-bold text-lg text-red-600">{stats.recentActivity.expenses}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium">Tâches</span><span className="font-bold text-lg text-red-600">{stats.recentActivity.tasks}</span></div>
                <div className="flex justify-between items-center"><span className="font-medium">Courses</span><span className="font-bold text-lg text-red-600">{stats.recentActivity.shopping}</span></div>
            </CardContent>
          </Card>
          {/* New Card: Taux d'adoption / fonctionnalité */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5" />Taux d'adoption / fonctionnalité</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center"><span className="font-medium">Dépenses</span><span className="font-bold text-lg text-red-600">{stats.adoptionRates.expenses.toFixed(0)}%</span></div>
                <div className="flex justify-between items-center"><span className="font-medium">Tâches</span><span className="font-bold text-lg text-red-600">{stats.adoptionRates.tasks.toFixed(0)}%</span></div>
                <div className="flex justify-between items-center"><span className="font-medium">Courses</span><span className="font-bold text-lg text-red-600">{stats.adoptionRates.shopping.toFixed(0)}%</span></div>
            </CardContent>
          </Card>
          {/* New Card: Budget Essentiel vs. Loisir (PieChart) */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PieIcon className="w-5 h-5" />Budget Essentiel vs. Loisir</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.budgetSplitData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} // Custom label with percentage
                      >
                          {stats.budgetSplitData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} />
                      <Legend iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyse détaillée & Monétisation Section */}
        <div className="space-y-2 mb-8"><h2 className="text-xl font-semibold text-gray-700">Analyse détaillée & Monétisation</h2><hr/></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Card: Répartition des dépenses (BarChart) */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Répartition des dépenses</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.expenseByCategoryData} layout="vertical" margin={{ left: 25, right: 25 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`} />
                    <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                       {stats.expenseByCategoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* New Card: Services récurrents mentionnés */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Services récurrents mentionnés</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-500">Détectés par mots-clés dans les titres des dépenses. Utile pour identifier des opportunités de partenariat.</p>
              {stats.topServices.length > 0 ? stats.topServices.map((item, index) => (
                <div key={item.name} className="flex items-center"> {/* Use item.name for key if unique */}
                  <div className="text-lg font-bold text-gray-400 w-8">{index + 1}.</div>
                  <div className="flex-1 font-medium text-gray-800">{item.name}</div>
                  <div className="text-lg font-bold text-red-600">{item.count}</div>
                </div>
              )) : <p className="text-center text-gray-500 pt-8">Aucun service récurrent détecté pour le moment.</p>}
            </CardContent>
          </Card>
        </div>

        {/* The original LineChart and Top Shopping Items card are removed as per the new outline */}
        {/* Original Line Chart:
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Croissance des utilisateurs (30j)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.userGrowthData}>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Utilisateurs" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        */}
        {/* Original Top Articles Card:
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Top 5 Articles de Courses</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {stats.topShoppingItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="text-lg font-bold text-gray-400 w-8">{index + 1}.</div>
                  <div className="flex-1 font-medium">{item.name}</div>
                  <div className="text-lg font-bold text-red-600">{item.count}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        */}
      </div>
    </div>
  );
}
