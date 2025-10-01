
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User } from "@/api/entities";
import { Task } from "@/api/entities";
import { Expense } from "@/api/entities";
import { Payment } from "@/api/entities";
import { Message } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  Home,
  CheckSquare,
  ShoppingCart,
  Euro,
  Mail,
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [showNav, setShowNav] = useState(false);
  const [notifications, setNotifications] = useState({
    tasks: 0,
    expenses: false,
    messages: 0
  });
  const isInConversation = currentPageName === "Conversation";
  
  useEffect(() => {
    const checkUserSetup = async () => {
      try {
        const user = await User.me();
        setShowNav(!!user.colocation_id);
        
        if (user.colocation_id) {
          loadNotifications(user);
        }
      } catch (error) {
        setShowNav(false);
      }
    };
    
    if (currentPageName === "index") {
      setShowNav(false);
    } else {
      checkUserSetup();
    }
  }, [currentPageName]);

  const loadNotifications = async (user) => {
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // Charger les données en parallèle
      const [tasksData, expensesData, paymentsData, messagesData, membersData] = await Promise.all([
        Task.filter({ colocation_id: user.colocation_id, assigned_to: user.email, status: { $ne: 'completed' } }).catch(() => []),
        Expense.filter({ colocation_id: user.colocation_id, month_year: currentMonth }).catch(() => []),
        Payment.filter({ colocation_id: user.colocation_id, month_year: currentMonth }).catch(() => []),
        Message.filter({ colocation_id: user.colocation_id, status: 'sent' }).catch(() => []),
        User.filter({ colocation_id: user.colocation_id }).catch(() => [])
      ]);

      // Calculer notifications tâches (nombre de tâches non complétées assignées à moi)
      const myTasksCount = tasksData.length;

      // Calculer notifications dépenses (ai-je des dettes ?)
      let totalOwed = 0;
      const balances = {};
      
      membersData.forEach(member => {
        balances[member.email] = { paid: 0, owes: 0 };
      });

      expensesData.forEach(expense => {
        if (balances[expense.paid_by]) {
          balances[expense.paid_by].paid += expense.amount;
        }
        const amountPerPerson = expense.amount / (membersData.length > 0 ? membersData.length : 1);

        membersData.forEach(member => {
          if (balances[member.email] && member.email !== expense.paid_by) {
            balances[member.email].owes += amountPerPerson;
          }
        });
      });

      // Soustraire les paiements confirmés
      const confirmedPayments = paymentsData.filter(p => p.status === 'confirmed');
      confirmedPayments.forEach(payment => {
        if (balances[payment.from_user]) {
          balances[payment.from_user].owes -= payment.amount;
        }
      });

      if (balances[user.email]) {
        totalOwed = Math.max(0, balances[user.email].owes);
      }

      // Calculer notifications messages (messages non lus envoyés par d'autres)
      const unreadMessages = messagesData.filter(msg => 
        msg.sender !== user.email && msg.status === 'sent'
      ).length;

      setNotifications({
        tasks: myTasksCount,
        expenses: totalOwed > 0,
        messages: unreadMessages
      });
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    }
  };

  const navItems = [
    { name: "Synthese", icon: Home, label: "Accueil", notification: null },
    { name: "Tasks", icon: CheckSquare, label: "Tâches", notification: notifications.tasks },
    { name: "Courses", icon: ShoppingCart, label: "Courses", notification: null },
    { name: "Expenses", icon: Euro, label: "Dépenses", notification: notifications.expenses ? true : null },
    { name: "Chat", icon: Mail, label: "Messages", notification: notifications.messages },
  ];

  const isActive = (pageName) => {
    return currentPageName === pageName || (pageName === "Synthese" && (currentPageName === "index" || currentPageName === "Dashboard"));
  };

  if (isInConversation || !showNav) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        html {
          font-size: 14.5px;
        }
        
        :root {
          --custom-blue: #1436ff;
          --custom-blue-hover: #0f2ae6;
          --custom-blue-light: #3d5aff;
        }
        
        .bg-blue-600, .bg-blue-500 {
          background-color: var(--custom-blue) !important;
        }
        
        .bg-blue-700 {
          background-color: var(--custom-blue-hover) !important;
        }
        
        .hover\\:bg-blue-600:hover, .hover\\:bg-blue-500:hover {
          background-color: var(--custom-blue) !important;
        }
        
        .hover\\:bg-blue-700:hover {
          background-color: var(--custom-blue-hover) !important;
        }
        
        .text-blue-600, .text-blue-500 {
          color: var(--custom-blue) !important;
        }
        
        .text-blue-700 {
          color: var(--custom-blue-hover) !important;
        }
        
        .hover\\:text-blue-600:hover, .hover\\:text-blue-500:hover {
          color: var(--custom-blue) !important;
        }
        
        .hover\\:text-blue-700:hover {
          color: var(--custom-blue-hover) !important;
        }
        
        .border-blue-600, .border-blue-500 {
          border-color: var(--custom-blue) !important;
        }
        
        .focus\\:border-blue-500:focus, .focus\\:border-blue-600:focus {
          border-color: var(--custom-blue) !important;
        }
        
        .from-blue-500 {
          --tw-gradient-from: var(--custom-blue);
        }
        
        .to-blue-600 {
          --tw-gradient-to: var(--custom-blue);
        }
        
        .from-blue-600 {
          --tw-gradient-from: var(--custom-blue);
        }
        
        .to-blue-700 {
          --tw-gradient-to: var(--custom-blue-hover);
        }
        
        .bg-blue-50 {
          background-color: rgba(20, 54, 255, 0.05) !important;
        }
        
        .bg-blue-100 {
          background-color: rgba(20, 54, 255, 0.1) !important;
        }
        
        .data-\\[state\\=checked\\]\\:bg-blue-600[data-state="checked"] {
          background-color: var(--custom-blue) !important;
        }
        
        .data-\\[state\\=checked\\]\\:border-blue-600[data-state="checked"] {
          border-color: var(--custom-blue) !important;
        }
      `}</style>
      
      <main className="pb-24 lg:pb-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t shadow-inner">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={createPageUrl(item.name)} 
              className={`flex flex-col items-center justify-center p-2 w-full h-full transition-colors relative ${
                isActive(item.name) ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 mb-1 ${isActive(item.name) ? 'scale-110' : ''}`} />
                {item.notification !== null && item.notification !== 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                    {typeof item.notification === 'number' ? (
                      <span className="text-white text-[10px] font-bold px-1">
                        {item.notification > 9 ? '9+' : item.notification}
                      </span>
                    ) : (
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
