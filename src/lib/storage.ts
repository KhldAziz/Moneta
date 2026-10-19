import {
  Transaction,
  UserProfile,
  BudgetRecord,
  CategoryRule,
  CategoryKey,
  AlertRecord,
} from '../types';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY_PREFIX = 'moneta_';

function getLocalKey(uid: string, key: string) {
  return `${LOCAL_STORAGE_KEY_PREFIX}${uid}_${key}`;
}

export const StorageService = {
  // 1. Profile
  async getProfile(uid: string): Promise<UserProfile | null> {
    if (db) {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data() as UserProfile;
      } catch (err) {
        console.warn('Firestore getProfile error, falling back to local:', err);
      }
    }
    const local = localStorage.getItem(getLocalKey(uid, 'profile'));
    return local ? JSON.parse(local) : null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    const key = getLocalKey(profile.uid, 'profile');
    localStorage.setItem(key, JSON.stringify(profile));

    if (db) {
      try {
        const docRef = doc(db, 'users', profile.uid);
        await setDoc(docRef, profile, { merge: true });
      } catch (err) {
        console.warn('Firestore saveProfile error:', err);
      }
    }
  },

  // 2. Transactions
  async getTransactions(uid: string): Promise<Transaction[]> {
    if (db) {
      try {
        const q = query(collection(db, 'users', uid, 'transactions'), orderBy('occurredAt', 'desc'));
        const snap = await getDocs(q);
        const list: Transaction[] = [];
        snap.forEach(docSnap => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        if (list.length > 0) {
          localStorage.setItem(getLocalKey(uid, 'transactions'), JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getTransactions error, fallback to local:', err);
      }
    }
    const local = localStorage.getItem(getLocalKey(uid, 'transactions'));
    return local ? JSON.parse(local) : [];
  },

  async saveTransactions(uid: string, transactions: Transaction[]): Promise<void> {
    localStorage.setItem(getLocalKey(uid, 'transactions'), JSON.stringify(transactions));
  },

  async addTransaction(uid: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const newTx: Transaction = { ...tx, id };

    const current = await this.getTransactions(uid);
    const updated = [newTx, ...current];
    await this.saveTransactions(uid, updated);

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid, 'transactions', id), newTx);
      } catch (err) {
        console.warn('Firestore addTransaction error:', err);
      }
    }

    return newTx;
  },

  async updateTransaction(uid: string, tx: Transaction): Promise<void> {
    const current = await this.getTransactions(uid);
    const updated = current.map(item => (item.id === tx.id ? tx : item));
    await this.saveTransactions(uid, updated);

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid, 'transactions', tx.id), tx, { merge: true });
      } catch (err) {
        console.warn('Firestore updateTransaction error:', err);
      }
    }
  },

  async softDeleteTransaction(uid: string, id: string): Promise<void> {
    const nowIso = new Date().toISOString();
    const current = await this.getTransactions(uid);
    const updated = current.map(item => (item.id === id ? { ...item, deletedAt: nowIso } : item));
    await this.saveTransactions(uid, updated);

    if (db) {
      try {
        await updateDoc(doc(db, 'users', uid, 'transactions', id), { deletedAt: nowIso });
      } catch (err) {
        console.warn('Firestore softDelete error:', err);
      }
    }
  },

  async restoreTransaction(uid: string, id: string): Promise<void> {
    const current = await this.getTransactions(uid);
    const updated = current.map(item => (item.id === id ? { ...item, deletedAt: null } : item));
    await this.saveTransactions(uid, updated);

    if (db) {
      try {
        await updateDoc(doc(db, 'users', uid, 'transactions', id), { deletedAt: null });
      } catch (err) {
        console.warn('Firestore restore error:', err);
      }
    }
  },

  async permanentlyDeleteTransaction(uid: string, id: string): Promise<void> {
    const current = await this.getTransactions(uid);
    const updated = current.filter(item => item.id !== id);
    await this.saveTransactions(uid, updated);

    if (db) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'transactions', id));
      } catch (err) {
        console.warn('Firestore delete error:', err);
      }
    }
  },

  // 3. Budgets
  async getBudgets(uid: string): Promise<BudgetRecord[]> {
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'budgets'));
        const list: BudgetRecord[] = [];
        snap.forEach(d => {
          list.push({ categoryKey: d.id as any, amount: d.data().amount });
        });
        if (list.length > 0) {
          localStorage.setItem(getLocalKey(uid, 'budgets'), JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getBudgets error, fallback to local:', err);
      }
    }
    const local = localStorage.getItem(getLocalKey(uid, 'budgets'));
    return local ? JSON.parse(local) : [];
  },

  async saveBudgets(uid: string, budgets: BudgetRecord[]): Promise<void> {
    localStorage.setItem(getLocalKey(uid, 'budgets'), JSON.stringify(budgets));

    if (db) {
      try {
        const batch = writeBatch(db);
        for (const b of budgets) {
          const docRef = doc(db, 'users', uid, 'budgets', b.categoryKey);
          batch.set(docRef, { amount: b.amount });
        }
        await batch.commit();
      } catch (err) {
        console.warn('Firestore saveBudgets error:', err);
      }
    }
  },

  // 4. Category Rules (PRD F7: auto-category learning)
  async getCategoryRules(uid: string): Promise<CategoryRule[]> {
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'categoryRules'));
        const list: CategoryRule[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        if (list.length > 0) {
          localStorage.setItem(getLocalKey(uid, 'categoryRules'), JSON.stringify(list));
          return list;
        }
      } catch (err) {
        console.warn('Firestore getCategoryRules error:', err);
      }
    }
    const local = localStorage.getItem(getLocalKey(uid, 'categoryRules'));
    return local ? JSON.parse(local) : [];
  },

  async addCategoryRule(uid: string, pattern: string, category: CategoryKey): Promise<void> {
    const cleanPattern = pattern.trim().toLowerCase();
    if (!cleanPattern) return;

    const rules = await this.getCategoryRules(uid);
    const existingIdx = rules.findIndex(r => r.pattern === cleanPattern);
    const ruleId = existingIdx >= 0 ? rules[existingIdx].id : 'rule_' + Date.now();
    const newRule: CategoryRule = { id: ruleId, pattern: cleanPattern, category };

    const updated = existingIdx >= 0
      ? rules.map((r, i) => (i === existingIdx ? newRule : r))
      : [newRule, ...rules];

    localStorage.setItem(getLocalKey(uid, 'categoryRules'), JSON.stringify(updated));

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid, 'categoryRules', ruleId), newRule);
      } catch (err) {
        console.warn('Firestore addCategoryRule error:', err);
      }
    }
  },

  // Match draft merchant against existing rules
  matchCategoryRule(rules: CategoryRule[], merchantOrText: string | null): CategoryKey | null {
    if (!merchantOrText) return null;
    const lower = merchantOrText.toLowerCase();
    for (const rule of rules) {
      if (lower.includes(rule.pattern)) {
        return rule.category;
      }
    }
    return null;
  },

  // 5. Alerts (PRD F9: track 80% and 100% alerts per period per threshold)
  async getAlerts(uid: string): Promise<Record<string, string>> {
    const local = localStorage.getItem(getLocalKey(uid, 'alerts'));
    return local ? JSON.parse(local) : {};
  },

  async markAlertSent(uid: string, alertKey: string): Promise<void> {
    const alerts = await this.getAlerts(uid);
    const nowIso = new Date().toISOString();
    alerts[alertKey] = nowIso;
    localStorage.setItem(getLocalKey(uid, 'alerts'), JSON.stringify(alerts));

    if (db) {
      try {
        await setDoc(doc(db, 'users', uid, 'alerts', alertKey), { sentAt: nowIso });
      } catch (err) {
        console.warn('Firestore markAlertSent error:', err);
      }
    }
  },

  // 6. Export CSV (PRD F14 & Uji 11: tanggal, tipe, nominal, kategori, merchant, catatan, sumber)
  exportCsv(transactions: Transaction[]): void {
    const active = transactions.filter(t => !t.deletedAt);
    const headers = ['tanggal', 'tipe', 'nominal', 'kategori', 'merchant', 'catatan', 'sumber'];
    
    const rows = active.map(t => [
      `"${t.occurredAt.slice(0, 10)}"`,
      `"${t.type}"`,
      t.amount,
      `"${t.category}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${t.source}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `moneta_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 7. Delete all user data (PRD F14 & Uji 12)
  async deleteAllData(uid: string): Promise<void> {
    // Clear localStorage keys
    const prefix = `${LOCAL_STORAGE_KEY_PREFIX}${uid}_`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));

    if (db) {
      try {
        // Delete profile doc
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.warn('Firestore deleteAllData error:', err);
      }
    }
  },
};
