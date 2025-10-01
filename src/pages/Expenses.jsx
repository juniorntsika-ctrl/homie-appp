
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Expense } from "@/api/entities";
import { Payment } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Euro, BarChart2, Receipt, Paperclip, X, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ModernExpenseForm from "@/components/expenses/ModernExpenseForm";
import ExpenseStats from "@/components/expenses/ExpenseStats";
import MonthSelector from "@/components/expenses/MonthSelector";

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [colocationMembers, setColocationMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebtDetails, setSelectedDebtDetails] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showPendingPayments, setShowPendingPayments] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.colocation_id) {
        const [expensesData, membersData, paymentsData] = await Promise.all([
          Expense.filter({ colocation_id: user.colocation_id, month_year: currentMonth }, '-date'),
          User.filter({ colocation_id: user.colocation_id }),
          Payment.filter({ colocation_id: user.colocation_id, month_year: currentMonth })
        ]);
        setExpenses(expensesData);
        setColocationMembers(membersData);
        setPayments(paymentsData);
        
        const pending = paymentsData.filter(p => p.to_user === user.email && p.status === 'pending');
        setPendingPayments(pending);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (expenseData) => {
    try {
      await Expense.create(expenseData);
      setShowForm(false);
      loadExpenses();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  const calculateBalances = () => {
    const balances = {};

    colocationMembers.forEach(member => {
      balances[member.email] = {
        paid: 0,
        owes: 0,
        net: 0,
        name: member.first_name || member.full_name?.split(' ')[0] || member.email.split('@')[0],
        debtsTo: {}
      };
    });

    expenses.forEach(expense => {
      if (balances[expense.paid_by]) {
        balances[expense.paid_by].paid += expense.amount;
      }

      const amountPerPerson = colocationMembers.length > 0 ? expense.amount / colocationMembers.length : 0;

      colocationMembers.forEach(member => {
        if (balances[member.email] && member.email !== expense.paid_by) {
          balances[member.email].owes += amountPerPerson;
          
          if (!balances[member.email].debtsTo[expense.paid_by]) {
            balances[member.email].debtsTo[expense.paid_by] = 0;
          }
          balances[member.email].debtsTo[expense.paid_by] += amountPerPerson;
        }
      });
    });

    payments.filter(p => p.status === 'confirmed').forEach(payment => {
      if (balances[payment.from_user] && balances[payment.from_user].debtsTo[payment.to_user]) {
        balances[payment.from_user].debtsTo[payment.to_user] -= payment.amount;
        balances[payment.from_user].owes -= payment.amount;
      }
    });

    Object.keys(balances).forEach(email => {
      balances[email].net = balances[email].paid - balances[email].owes;
    });

    return balances;
  };

  const handleMarkAsPaid = async (toUserEmail, amount) => {
    try {
      await Payment.create({
        from_user: currentUser.email,
        to_user: toUserEmail,
        amount: amount,
        colocation_id: currentUser.colocation_id,
        month_year: currentMonth,
        status: 'pending'
      });

      alert("Paiement enregistré ! En attente de confirmation.");
      setSelectedDebtDetails(null);
      loadExpenses();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      alert("Erreur lors de l'enregistrement du paiement");
    }
  };

  const handleConfirmPayment = async (payment, confirm) => {
    try {
      await Payment.update(payment.id, {
        status: confirm ? 'confirmed' : 'rejected',
        confirmed_date: new Date().toISOString()
      });

      alert(confirm ? "Paiement confirmé !" : "Paiement refusé");
      setShowPendingPayments(false);
      loadExpenses();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      alert("Erreur lors de la confirmation");
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      courses: '🛒',
      factures: '⚡',
      loisirs: '🎉',
      transport: '🚗',
      menage: '🧽',
      autre: '💰'
    };
    return icons[category] || '💰';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const balances = calculateBalances();
  const myBalance = balances[currentUser?.email] || { net: 0, name: 'Moi', paid: 0, owes: 0, debtsTo: {} };

  const myDebtsWithPending = Object.entries(myBalance.debtsTo)
    .map(([toEmail, amount]) => {
      const pendingToThisPerson = payments
        .filter(p => p.from_user === currentUser?.email && p.to_user === toEmail && p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const member = colocationMembers.find(m => m.email === toEmail);
      return {
        toEmail,
        toName: member?.first_name || member?.full_name?.split(' ')[0] || toEmail.split('@')[0],
        amount,
        pendingAmount: pendingToThisPerson
      };
    })
    .filter(d => d.amount > 0);

  // Filtrer uniquement MES dépenses (celles que j'ai payées)
  const myExpenses = expenses.filter(expense => expense.paid_by === currentUser?.email);

  return (
    <div className="p-4 space-y-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Dépenses</h1>
            <p className="text-sm text-gray-600">Gérez les frais de votre colocation</p>
          </div>
          <Button
            onClick={() => { setShowForm(s => !s); setShowStats(false); }}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-10 w-10"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {!showForm && <MonthSelector currentMonth={currentMonth} onMonthChange={setCurrentMonth} />}

        {showForm && (
          <ModernExpenseForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            currentUser={currentUser}
            colocationMembers={colocationMembers}
          />
        )}

        {showStats && (
          <ExpenseStats expenses={expenses} colocationMembers={colocationMembers} currentMonth={currentMonth} />
        )}

        {!showForm && !showStats && (
          <>
            {/* Badge paiements en attente */}
            {pendingPayments.length > 0 && (
              <Card 
                className="border-0 shadow-md bg-orange-50 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setShowPendingPayments(true)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-sm text-orange-900">
                        {pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente
                      </p>
                      <p className="text-xs text-orange-700">Cliquez pour confirmer</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-600 text-white">{pendingPayments.length}</Badge>
                </CardContent>
              </Card>
            )}

            {/* Récapitulatif avec 3 colonnes */}
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-800">Mon récapitulatif du mois</h3>
                  <Euro className="w-4 h-4 text-blue-600" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    className="text-center p-2 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => myDebtsWithPending.length > 0 && setSelectedDebtDetails({ type: 'debts', debts: myDebtsWithPending })}
                  >
                    <p className="text-xs text-red-700 mb-1">Je dois</p>
                    <p className="font-bold text-base text-red-600">{myBalance.owes.toFixed(2)}€</p>
                    {myDebtsWithPending.length > 0 && (
                      <p className="text-[10px] text-red-500 mt-1">Voir détails</p>
                    )}
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50">
                    <p className="text-xs text-green-700 mb-1">On me doit</p>
                    <p className="font-bold text-base text-green-600">{(myBalance.paid - (myBalance.paid / colocationMembers.length || 0)).toFixed(2)}€</p>
                  </div>
                  <div
                    className={`text-center p-2 rounded-lg ${myBalance.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}
                  >
                    <p className={`text-xs mb-1 ${myBalance.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Solde net</p>
                    <p className={`font-bold text-base ${myBalance.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {myBalance.net >= 0 ? '+' : ''}{myBalance.net.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section "À rembourser" */}
            {myDebtsWithPending.length > 0 && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="w-4 h-4 text-red-600" />
                    À rembourser
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {myDebtsWithPending.map((debt, index) => (
                      <div key={index} className="p-3 rounded-xl bg-red-50 border border-red-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">Vous devez à {debt.toName}</p>
                            <p className="text-xs text-gray-500">
                              {debt.pendingAmount > 0 && (
                                <span className="text-orange-600">
                                  {debt.pendingAmount.toFixed(2)}€ en attente de confirmation
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-red-600">{debt.amount.toFixed(2)}€</p>
                        </div>
                        
                        {debt.amount > debt.pendingAmount && (
                          <Button
                            onClick={() => handleMarkAsPaid(debt.toEmail, debt.amount - debt.pendingAmount)}
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            J'ai payé {(debt.amount - debt.pendingAmount).toFixed(2)}€
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste de MES dépenses */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="w-4 h-4 text-gray-600" />
                  Mes dépenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {myExpenses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">Vous n'avez enregistré aucune dépense ce mois-ci.</p>
                ) : (
                  <div className="space-y-1">
                    {myExpenses.map(expense => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm">{getCategoryIcon(expense.category)}</div>
                          <div>
                            <h4 className="font-medium text-sm">{expense.title}</h4>
                            <p className="text-xs text-gray-500">
                              {format(new Date(expense.date), 'dd MMM', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <div>
                            <p className="font-semibold text-sm">{expense.amount.toFixed(2)}€</p>
                            <p className="text-xs text-gray-500">
                              {(expense.amount / (colocationMembers.length > 0 ? colocationMembers.length : 1)).toFixed(2)}€/pers
                            </p>
                          </div>
                          {expense.receipt_url && (
                            <Paperclip
                              className="w-3 h-3 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(expense.receipt_url, '_blank');
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Floating Stats Button */}
      {!showForm && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center items-center z-10">
          <Button
            onClick={() => { setShowStats(s => !s); setShowForm(false); }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg h-12 px-6 transition-all"
          >
            {showStats ? <X className="w-5 h-5 mr-2" /> : <BarChart2 className="w-5 h-5 mr-2" />}
            {showStats ? 'Fermer' : 'Statistiques'}
          </Button>
        </div>
      )}

      {/* Modal détails des dettes */}
      {selectedDebtDetails && (
        <Dialog open={!!selectedDebtDetails} onOpenChange={() => setSelectedDebtDetails(null)}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Euro className="w-5 h-5 text-red-600" />
                Mes dettes
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDebtDetails.debts.map((debt, index) => (
                <div key={index} className="border rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">Vous devez à {debt.toName}</p>
                      <p className="text-2xl font-bold text-red-600">{debt.amount.toFixed(2)}€</p>
                    </div>
                  </div>
                  
                  {debt.pendingAmount > 0 && (
                    <div className="bg-orange-50 rounded-lg p-2">
                      <div className="flex items-center gap-2 text-orange-700">
                        <Clock className="w-4 h-4" />
                        <p className="text-xs font-medium">
                          {debt.pendingAmount.toFixed(2)}€ en attente de confirmation
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {debt.amount > debt.pendingAmount && (
                    <Button
                      onClick={() => handleMarkAsPaid(debt.toEmail, debt.amount - debt.pendingAmount)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      J'ai payé {(debt.amount - debt.pendingAmount).toFixed(2)}€
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal paiements en attente de confirmation */}
      {showPendingPayments && (
        <Dialog open={showPendingPayments} onOpenChange={setShowPendingPayments}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-orange-600" />
                Paiements à confirmer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingPayments.map((payment) => {
                const fromUser = colocationMembers.find(m => m.email === payment.from_user);
                const fromName = fromUser?.first_name || fromUser?.full_name?.split(' ')[0] || payment.from_user.split('@')[0];
                
                return (
                  <div key={payment.id} className="border rounded-xl p-3 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{fromName}</span> vous a remboursé
                      </p>
                      <p className="text-2xl font-bold text-green-600">{payment.amount.toFixed(2)}€</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(payment.created_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirmPayment(payment, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmer
                      </Button>
                      <Button
                        onClick={() => handleConfirmPayment(payment, false)}
                        variant="outline"
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50 text-sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
