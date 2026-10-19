import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  Transaction,
  BudgetRecord,
  CategoryRule,
  CategoryKey,
} from './types';
import { StorageService } from './lib/storage';
import { loginWithGoogle, logoutUser, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { calculatePeriod, calculatePeriodTotals } from './lib/calculations';
import { STRINGS } from './constants/strings';

import { Layout, NavTab } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { Toast, ToastData } from './components/Toast';

export const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<{ uid: string; displayName: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastData | null>(null);

  // Undo soft-delete timer ref
  const undoTimeoutRef = React.useRef<any>(null);

  // 1. Listen for Auth or restore session
  useEffect(() => {
    // Check local active session first
    const savedUser = localStorage.getItem('moneta_active_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch {
        // ignore
      }
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const u = { uid: fbUser.uid, displayName: fbUser.displayName || 'Mahasiswa' };
          setUser(u);
          localStorage.setItem('moneta_active_user', JSON.stringify(u));
        }
        setIsLoadingAuth(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  // 2. Load user data when user changes
  const loadUserData = useCallback(async (uid: string) => {
    const prof = await StorageService.getProfile(uid);
    setProfile(prof);

    if (prof?.onboardingDone) {
      const [txs, bgs, rules] = await Promise.all([
        StorageService.getTransactions(uid),
        StorageService.getBudgets(uid),
        StorageService.getCategoryRules(uid),
      ]);
      setTransactions(txs);
      setBudgets(bgs);
      setCategoryRules(rules);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadUserData(user.uid);
    } else {
      setProfile(null);
      setTransactions([]);
      setBudgets([]);
      setCategoryRules([]);
    }
  }, [user, loadUserData]);

  // Check budget threshold alerts (80% and 100%) and trigger toast once per period per threshold (PRD F9)
  const checkBudgetThresholdAlerts = useCallback(
    async (currentTx: Transaction[], currentBudgets: BudgetRecord[], prof: UserProfile) => {
      const period = calculatePeriod(prof.cycleStartDay);
      const activeTx = currentTx.filter((t) => {
        if (t.deletedAt) return false;
        const d = t.occurredAt.slice(0, 10);
        return d >= period.startDate && d <= period.endDate;
      });

      const { expenseByCategory } = calculatePeriodTotals(activeTx);
      const existingAlerts = await StorageService.getAlerts(prof.uid);

      for (const b of currentBudgets) {
        if (b.categoryKey !== 'total' && b.amount > 0) {
          const spent = expenseByCategory[b.categoryKey as CategoryKey] || 0;
          const ratio = spent / b.amount;

          // 100% threshold
          if (ratio >= 1.0) {
            const alertKey = `${period.startDate}_${b.categoryKey}_100`;
            if (!existingAlerts[alertKey]) {
              await StorageService.markAlertSent(prof.uid, alertKey);
              setToast({
                id: 'alert_100_' + Date.now(),
                message: STRINGS.budget.toastThresholdExceeded(b.categoryKey),
                type: 'danger',
                durationMs: 5000,
              });
              break; // Show one at a time
            }
          } else if (ratio >= 0.8) {
            // 80% threshold
            const alertKey = `${period.startDate}_${b.categoryKey}_80`;
            if (!existingAlerts[alertKey]) {
              await StorageService.markAlertSent(prof.uid, alertKey);
              setToast({
                id: 'alert_80_' + Date.now(),
                message: STRINGS.budget.toastThresholdWarning(b.categoryKey),
                type: 'warning',
                durationMs: 5000,
              });
              break;
            }
          }
        }
      }
    },
    []
  );

  // Login Handlers
  const handleGoogleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      if (res) {
        setUser(res);
        localStorage.setItem('moneta_active_user', JSON.stringify(res));
      } else {
        // Fallback demo if Firebase credentials not configured in cloud
        handleDemoLogin();
      }
    } catch (err) {
      console.warn('Google login failed, using demo account:', err);
      handleDemoLogin();
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      uid: 'demo_user_1',
      displayName: 'Aziz (Mahasiswa)',
    };
    setUser(demoUser);
    localStorage.setItem('moneta_active_user', JSON.stringify(demoUser));
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('moneta_active_user');
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = async (allowance: number, cycleStartDay: number) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      monthlyAllowance: allowance,
      cycleStartDay,
      onboardingDone: true,
      createdAt: new Date().toISOString(),
    };
    await StorageService.saveProfile(newProfile);
    setProfile(newProfile);

    // Initialize default budget allocations
    const defaultBudgets: BudgetRecord[] = [
      { categoryKey: 'total', amount: allowance },
    ];
    await StorageService.saveBudgets(user.uid, defaultBudgets);
    setBudgets(defaultBudgets);
  };

  // Add Transactions Handler
  const handleSaveNewTransactions = async (
    draftTxs: Omit<Transaction, 'id' | 'createdAt'>[],
    rulesToSave?: { merchant: string; category: CategoryKey }[]
  ) => {
    if (!user || !profile) return;

    // Save learned category rules (PRD F7)
    if (rulesToSave && rulesToSave.length > 0) {
      for (const r of rulesToSave) {
        await StorageService.addCategoryRule(user.uid, r.merchant, r.category);
      }
      const updatedRules = await StorageService.getCategoryRules(user.uid);
      setCategoryRules(updatedRules);
    }

    // Save transactions
    const added: Transaction[] = [];
    for (const d of draftTxs) {
      const saved = await StorageService.addTransaction(user.uid, {
        ...d,
        createdAt: new Date().toISOString(),
      });
      added.push(saved);
    }

    const updatedTransactions = [...added, ...transactions];
    setTransactions(updatedTransactions);

    setToast({
      id: 'tx_added_' + Date.now(),
      message: `${added.length} transaksi berhasil dicatat!`,
      type: 'success',
      durationMs: 3000,
    });

    // Check thresholds
    checkBudgetThresholdAlerts(updatedTransactions, budgets, profile);
  };

  // Edit Transaction Handler
  const handleSaveEditedTransaction = async (
    updated: Transaction,
    categoryChangedMerchant?: { merchant: string; category: CategoryKey }
  ) => {
    if (!user || !profile) return;

    if (categoryChangedMerchant) {
      await StorageService.addCategoryRule(
        user.uid,
        categoryChangedMerchant.merchant,
        categoryChangedMerchant.category
      );
      const updatedRules = await StorageService.getCategoryRules(user.uid);
      setCategoryRules(updatedRules);
    }

    await StorageService.updateTransaction(user.uid, updated);
    const updatedList = transactions.map((t) => (t.id === updated.id ? updated : t));
    setTransactions(updatedList);

    setToast({
      id: 'tx_updated_' + Date.now(),
      message: 'Transaksi berhasil diperbarui.',
      type: 'success',
      durationMs: 3000,
    });

    checkBudgetThresholdAlerts(updatedList, budgets, profile);
  };

  // Soft Delete with 5s Undo (PRD F8 & Uji 9)
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;

    // Perform soft delete immediately
    await StorageService.softDeleteTransaction(user.uid, id);
    const updatedList = transactions.map((t) =>
      t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
    );
    setTransactions(updatedList);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Set 5 seconds timer to make delete permanent
    undoTimeoutRef.current = setTimeout(async () => {
      await StorageService.permanentlyDeleteTransaction(user.uid, id);
    }, 5500);

    // Show toast with Undo button
    setToast({
      id: 'tx_deleted_' + Date.now(),
      message: STRINGS.transactions.undoToastText,
      type: 'info',
      durationMs: 5000,
      undoLabel: 'Batalkan',
      undoAction: async () => {
        if (undoTimeoutRef.current) {
          clearTimeout(undoTimeoutRef.current);
        }
        await StorageService.restoreTransaction(user.uid, id);
        const restoredList = transactions.map((t) =>
          t.id === id ? { ...t, deletedAt: null } : t
        );
        setTransactions(restoredList);
      },
    });
  };

  // Save Budgets Handler
  const handleSaveBudgets = async (updatedBudgets: BudgetRecord[]) => {
    if (!user || !profile) return;
    await StorageService.saveBudgets(user.uid, updatedBudgets);
    setBudgets(updatedBudgets);

    setToast({
      id: 'budget_saved_' + Date.now(),
      message: 'Budget bulanan berhasil diperbarui.',
      type: 'success',
      durationMs: 3000,
    });

    checkBudgetThresholdAlerts(transactions, updatedBudgets, profile);
  };

  // Update Profile Handler
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!user || !profile) return;
    const newProfile = { ...profile, ...updated };
    await StorageService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  // Delete All Data Handler (PRD F14 & Uji 12)
  const handleDeleteAllData = async () => {
    if (!user) return;
    await StorageService.deleteAllData(user.uid);
    setTransactions([]);
    setBudgets([]);
    setCategoryRules([]);
    setProfile(null);
    setUser(null);
    localStorage.removeItem('moneta_active_user');
  };

  // Export CSV Handler (PRD F14 & Uji 11)
  const handleExportCsv = () => {
    StorageService.exportCsv(transactions);
  };

  // Screen 1: Login
  if (!user) {
    return (
      <LoginPage
        onLoginWithGoogle={handleGoogleLogin}
        onLoginDemo={handleDemoLogin}
        isLoading={isLoadingAuth}
      />
    );
  }

  // Screen 2: Onboarding (if not completed yet)
  if (!profile || !profile.onboardingDone) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  // Screen 3: Main App Tabs
  return (
    <Layout
      currentTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenAddModal={() => setIsAddModalOpen(true)}
      userDisplayName={profile.displayName}
    >
      {activeTab === 'home' && (
        <HomePage
          profile={profile}
          transactions={transactions}
          budgets={budgets}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onNavigateToTransactions={() => setActiveTab('transactions')}
          onEditTransaction={(tx) => setEditingTransaction(tx)}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsPage
          transactions={transactions}
          onEditTransaction={(tx) => setEditingTransaction(tx)}
          onDeleteTransaction={handleDeleteTransaction}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      )}

      {activeTab === 'budget' && (
        <BudgetPage
          profile={profile}
          transactions={transactions}
          budgets={budgets}
          onSaveBudgets={handleSaveBudgets}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsPage
          profile={profile}
          transactions={transactions}
          onUpdateProfile={handleUpdateProfile}
          onExportCsv={handleExportCsv}
          onDeleteAllData={handleDeleteAllData}
          onLogout={handleLogout}
        />
      )}

      {/* Add Transaction Modal (Chat AI, Photo, Manual) */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveTransactions={handleSaveNewTransactions}
        existingRules={categoryRules}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveEditedTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Toast with Undo */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </Layout>
  );
};

export default App;
