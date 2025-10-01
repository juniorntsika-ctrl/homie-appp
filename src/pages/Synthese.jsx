
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Task } from "@/api/entities";
import { Expense } from "@/api/entities";
import { ShoppingItem } from "@/api/entities";
import { Payment } from "@/api/entities";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added for previous months' balances details
import {
  CheckSquare,
  ShoppingCart,
  Euro,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle // Added for previous months' balances
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SynthesePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allShoppingItems, setAllShoppingItems] = useState([]);
  const [myDebts, setMyDebts] = useState([]);
  const [debtsOwedToMe, setDebtsOwedToMe] = useState([]);
  const [colocationMembers, setColocationMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState({ 
    totalOwed: 0, 
    totalOwedToMe: 0, 
    netBalance: 0,
    previousMonthsOwed: 0,
    previousMonthsOwedToMe: 0,
    previousMonthsDebtsDetails: [], // Added
    previousMonthsOwedToMeDetails: [] // Added
  });
  const [monthStats, setMonthStats] = useState({ totalExpenses: 0, myExpenses: 0, expenseCount: 0 });
  const [showPreviousDebtsModal, setShowPreviousDebtsModal] = useState(null); // Added

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (!user.colocation_id) {
        navigate(createPageUrl("index"));
        return;
      }

      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // Charger toutes les dépenses et paiements (tous les mois)
      const [tasksData, allExpensesData, shoppingData, membersData, allPaymentsData] = await Promise.all([
        Task.filter({ colocation_id: user.colocation_id, status: { $ne: 'completed' } }, '-due_date'),
        Expense.filter({ colocation_id: user.colocation_id }),
        ShoppingItem.filter({ colocation_id: user.colocation_id, is_purchased: false }),
        User.filter({ colocation_id: user.colocation_id }),
        Payment.filter({ colocation_id: user.colocation_id })
      ]);

      setAllTasks(tasksData);
      setMyTasks(tasksData.filter(t => t.assigned_to === user.email));
      setAllShoppingItems(shoppingData);
      setColocationMembers(membersData);

      // Filter expenses for the current month
      const currentMonthExpenses = allExpensesData.filter(exp => exp.month_year === currentMonth);
      
      // Calculer stats du mois actuel
      const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const myExpenses = currentMonthExpenses.filter(exp => exp.paid_by === user.email).reduce((sum, exp) => sum + exp.amount, 0);
      setMonthStats({
        totalExpenses,
        myExpenses,
        expenseCount: currentMonthExpenses.length
      });

      // Calculer les balances par mois
      const monthlyBalances = {};
      const uniqueMonths = [...new Set(allExpensesData.map(exp => exp.month_year))].sort();
      
      uniqueMonths.forEach(month => {
        const monthExpenses = allExpensesData.filter(exp => exp.month_year === month);
        const monthPayments = allPaymentsData.filter(p => p.month_year === month);
        
        // Initialize balance for each member for this month
        const balances = {};
        membersData.forEach(member => {
          balances[member.email] = {
            paid: 0, // Total paid by this member in this month
            owes: 0, // Total this member owes to others for their share of expenses in this month (gross, before payments)
            name: member.first_name || member.full_name?.split(' ')[0] || member.email.split('@')[0],
            debtsTo: {}, // What THIS MEMBER (key) owes to specific other members (value: amount)
            owedBy: {} // What THIS MEMBER (key) is owed by specific other members (value: amount)
          };
        });

        // Process expenses to determine initial debts/credits
        monthExpenses.forEach(expense => {
          if (balances[expense.paid_by]) {
            balances[expense.paid_by].paid += expense.amount; // Record what the payer paid
          }
          const amountPerPerson = expense.amount / (membersData.length > 0 ? membersData.length : 1);

          membersData.forEach(member => {
            if (member.email !== expense.paid_by) {
              // member.email owes amountPerPerson to expense.paid_by for this expense
              balances[member.email].owes += amountPerPerson; // Aggregate total owed for this member

              // Track specific debt: member.email owes expense.paid_by
              if (!balances[member.email].debtsTo[expense.paid_by]) {
                balances[member.email].debtsTo[expense.paid_by] = 0;
              }
              balances[member.email].debtsTo[expense.paid_by] += amountPerPerson;

              // Track specific credit: expense.paid_by is owed by member.email
              if (!balances[expense.paid_by].owedBy[member.email]) {
                balances[expense.paid_by].owedBy[member.email] = 0;
              }
              balances[expense.paid_by].owedBy[member.email] += amountPerPerson;
            }
          });
        });

        // Apply confirmed payments for this month
        monthPayments.filter(p => p.status === 'confirmed').forEach(payment => {
          const fromUserEmail = payment.from_user;
          const toUserEmail = payment.to_user;
          const amount = payment.amount;

          // Reduce total amount fromUserEmail owes
          if (balances[fromUserEmail]) {
            balances[fromUserEmail].owes -= amount;
          }

          // Reduce specific debt fromUserEmail owes toUserEmail
          if (balances[fromUserEmail] && balances[fromUserEmail].debtsTo[toUserEmail]) {
            balances[fromUserEmail].debtsTo[toUserEmail] = Math.max(0, balances[fromUserEmail].debtsTo[toUserEmail] - amount);
          }
          
          // Reduce specific credit toUserEmail is owed by fromUserEmail
          if (balances[toUserEmail] && balances[toUserEmail].owedBy[fromUserEmail]) {
            balances[toUserEmail].owedBy[fromUserEmail] = Math.max(0, balances[toUserEmail].owedBy[fromUserEmail] - amount);
          }
        });

        monthlyBalances[month] = balances;
      });

      // Calculer dettes et créances du mois actuel (using monthlyBalances which includes current month payments)
      const currentBalances = monthlyBalances[currentMonth] || {};
      const myCurrentBalance = currentBalances[user.email] || { paid: 0, owes: 0, debtsTo: {}, owedBy: {} };

      const currentDebts = []; // What I owe to others this month (net)
      const currentOwedToMe = []; // What others owe to me this month (net)

      // My debts to others for the current month
      Object.entries(myCurrentBalance.debtsTo || {}).forEach(([toEmail, amount]) => {
        if (amount > 0) {
          const member = membersData.find(m => m.email === toEmail);
          currentDebts.push({
            to: toEmail,
            toName: member?.first_name || member?.full_name?.split(' ')[0] || toEmail.split('@')[0],
            amount
          });
        }
      });

      // What others owe to me for the current month
      Object.entries(myCurrentBalance.owedBy || {}).forEach(([fromEmail, amount]) => {
        if (amount > 0) {
          const member = membersData.find(m => m.email === fromEmail);
          currentOwedToMe.push({
            from: fromEmail,
            fromName: member?.first_name || member?.full_name?.split(' ')[0] || fromEmail.split('@')[0],
            amount
          });
        }
      });

      const debtsForState = currentDebts.filter(d => d.amount > 0);
      const owedToMeForState = currentOwedToMe.filter(d => d.amount > 0);
      setMyDebts(debtsForState);
      setDebtsOwedToMe(owedToMeForState);

      // Total current month net owed/owed to me
      const totalOwed = debtsForState.reduce((sum, d) => sum + d.amount, 0);
      const totalOwedToMe = owedToMeForState.reduce((sum, d) => sum + d.amount, 0);
      const netBalance = totalOwedToMe - totalOwed;

      // Calculer dettes et créances des mois précédents avec détails
      let previousMonthsOwed = 0;
      let previousMonthsOwedToMe = 0;
      const previousDebtsDetailsMap = {}; // Aggregates what I owe to each person from previous months
      const previousOwedToMeDetailsMap = {}; // Aggregates what each person owes to me from previous months

      uniqueMonths.filter(m => m < currentMonth).forEach(month => {
        const monthBalances = monthlyBalances[month];
        const userMonthBalance = monthBalances?.[user.email];

        if (userMonthBalance) {
          // What I owe to others from this previous month
          Object.entries(userMonthBalance.debtsTo || {}).forEach(([toEmail, amount]) => {
            if (amount > 0) {
              previousMonthsOwed += amount;
              if (!previousDebtsDetailsMap[toEmail]) {
                const member = membersData.find(m => m.email === toEmail);
                previousDebtsDetailsMap[toEmail] = {
                  toName: member?.first_name || member?.full_name?.split(' ')[0] || toEmail.split('@')[0],
                  amount: 0
                };
              }
              previousDebtsDetailsMap[toEmail].amount += amount;
            }
          });

          // What others owe to me from this previous month
          Object.entries(userMonthBalance.owedBy || {}).forEach(([fromEmail, amount]) => {
            if (amount > 0) {
              previousMonthsOwedToMe += amount;
              if (!previousOwedToMeDetailsMap[fromEmail]) {
                const member = membersData.find(m => m.email === fromEmail);
                previousOwedToMeDetailsMap[fromEmail] = {
                  fromName: member?.first_name || member?.full_name?.split(' ')[0] || fromEmail.split('@')[0],
                  amount: 0
                };
              }
              previousOwedToMeDetailsMap[fromEmail].amount += amount;
            }
          });
        }
      });

      setFinancialSummary({
        totalOwed: totalOwed,
        totalOwedToMe: totalOwedToMe,
        netBalance,
        previousMonthsOwed,
        previousMonthsOwedToMe,
        previousMonthsDebtsDetails: Object.values(previousDebtsDetailsMap),
        previousMonthsOwedToMeDetails: Object.values(previousOwedToMeDetailsMap)
      });

    } catch (error) {
      console.error("Erreur de chargement:", error);
      navigate(createPageUrl("index"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTaskUrgency = (task) => {
    if (!task.due_date) return '';
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return 'En retard';
    if (isToday(dueDate)) return 'Aujourd\'hui';
    if (isTomorrow(dueDate)) return 'Demain';
    return format(dueDate, 'dd MMM', { locale: fr });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const financial = financialSummary;
  const urgentTasks = myTasks.filter(t => t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date))));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 space-y-5 pb-24 max-w-4xl mx-auto">
        
        {/* En-tête minimaliste */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Bonjour {currentUser?.first_name || currentUser?.full_name?.split(' ')[0]} 👋
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <Link to={createPageUrl("Settings")}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-base hover:bg-blue-200 transition-colors">
                {currentUser?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
          </div>
        </div>

        {/* Finances section - Style Fintech */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Vue d'ensemble</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(createPageUrl("Expenses"))}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs"
            >
              Voir détails
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {/* Solde principal */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Solde du mois</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {format(new Date(), 'MMMM', { locale: fr })}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-semibold ${
                    financial.netBalance >= 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {financial.netBalance >= 0 ? '+' : ''}{financial.netBalance.toFixed(2)}€
                  </span>
                  {financial.netBalance >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {financial.netBalance >= 0 
                    ? 'Vous êtes créditeur ce mois-ci' 
                    : 'Vous avez des dettes à régler'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Détails financiers - 3 colonnes épurées */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Je dois</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {financial.totalOwed.toFixed(0)}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                      <ArrowDownRight className="w-3.5 h-3.5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">On me doit</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {financial.totalOwedToMe.toFixed(0)}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Euro className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Total dépenses</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {monthStats.totalExpenses.toFixed(0)}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails des dettes si existantes */}
          {(myDebts.length > 0 || debtsOwedToMe.length > 0) && (
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {myDebts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-2">À rembourser</h3>
                      <div className="space-y-1.5">
                        {myDebts.map((debt, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                            <span className="text-xs text-gray-700">{debt.toName}</span>
                            <span className="text-xs font-medium text-red-600">
                              {debt.amount.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {debtsOwedToMe.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 mb-2">À recevoir</h3>
                      <div className="space-y-1.5">
                        {debtsOwedToMe.map((debt, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                            <span className="text-xs text-gray-700">{debt.fromName}</span>
                            <span className="text-xs font-medium text-green-600">
                              {debt.amount.toFixed(2)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rappel dettes/créances mois précédents */}
        {(financial.previousMonthsOwed > 0 || financial.previousMonthsOwedToMe > 0) && (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-orange-900 mb-2">
                    Soldes des mois précédents
                  </h3>
                  <div className="space-y-1.5">
                    {financial.previousMonthsOwed > 0 && (
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 cursor-pointer hover:bg-white/80 transition-colors"
                        onClick={() => setShowPreviousDebtsModal('debts')}
                      >
                        <span className="text-xs text-orange-800">Vous devez encore</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-600">
                            {financial.previousMonthsOwed.toFixed(2)}€
                          </span>
                          <ChevronRight className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                    )}
                    {financial.previousMonthsOwedToMe > 0 && (
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 cursor-pointer hover:bg-white/80 transition-colors"
                        onClick={() => setShowPreviousDebtsModal('owed')}
                      >
                        <span className="text-xs text-orange-800">On vous doit encore</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-600">
                            {financial.previousMonthsOwedToMe.toFixed(2)}€
                          </span>
                          <ChevronRight className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-orange-700 mt-2">
                    💡 Cliquez pour voir le détail • Pensez à régulariser ces montants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tâches urgentes */}
        {urgentTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Tâches urgentes</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(createPageUrl("Tasks"))}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs"
              >
                Voir toutes
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  {urgentTasks.slice(0, 3).map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{task.title}</span>
                      </div>
                      {task.due_date && (
                        <Badge 
                          variant="outline" 
                          className={`ml-2 text-[10px] h-5 ${
                            isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))
                              ? 'border-red-200 text-red-600'
                              : 'border-orange-200 text-orange-600'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {getTaskUrgency(task)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mes tâches */}
        {myTasks.length > 0 && urgentTasks.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Mes tâches</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(createPageUrl("Tasks"))}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs"
              >
                Voir toutes ({myTasks.length})
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  {myTasks.slice(0, 3).map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate">{task.title}</span>
                      </div>
                      {task.due_date && (
                        <Badge variant="outline" className="ml-2 text-[10px] h-5">
                          {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste de courses */}
        {allShoppingItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Courses à faire</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(createPageUrl("Courses"))}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs"
              >
                Voir toutes ({allShoppingItems.length})
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  {allShoppingItems.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate">{item.name}</p>
                          {item.quantity && (
                            <p className="text-[10px] text-gray-500">{item.quantity}</p>
                          )}
                        </div>
                      </div>
                      {item.is_urgent && (
                        <Badge className="bg-red-500 text-white border-0 ml-2 text-[10px] h-5">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message si tout va bien */}
        {myTasks.length === 0 && allShoppingItems.length === 0 && financial.totalOwed === 0 && financial.totalOwedToMe === 0 && financial.previousMonthsOwed === 0 && financial.previousMonthsOwedToMe === 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Tout est à jour !</h2>
              <p className="text-xs text-gray-600">
                Aucune tâche en attente et vos finances sont équilibrées.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal détails dettes/créances mois précédents */}
        {showPreviousDebtsModal && (
          <Dialog open={!!showPreviousDebtsModal} onOpenChange={() => setShowPreviousDebtsModal(null)}>
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  {showPreviousDebtsModal === 'debts' ? 'Mes dettes des mois précédents' : 'Créances des mois précédents'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {showPreviousDebtsModal === 'debts' && financial.previousMonthsDebtsDetails.length > 0 ? (
                  financial.previousMonthsDebtsDetails.map((debt, index) => (
                    <div key={index} className="border rounded-xl p-3 bg-red-50 border-red-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            Vous devez à {debt.toName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Des mois précédents non réglés
                          </p>
                        </div>
                        <p className="text-xl font-bold text-red-600">
                          {debt.amount.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))
                ) : showPreviousDebtsModal === 'owed' && financial.previousMonthsOwedToMeDetails.length > 0 ? (
                  financial.previousMonthsOwedToMeDetails.map((debt, index) => (
                    <div key={index} className="border rounded-xl p-3 bg-green-50 border-green-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            {debt.fromName} vous doit
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Des mois précédents non réglés
                          </p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {debt.amount.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucun détail disponible</p>
                )}
              </div>
              <Button 
                onClick={() => setShowPreviousDebtsModal(null)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
              >
                Fermer
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
