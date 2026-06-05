import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoanRequest, ActiveLoan } from '../types';

const REQUESTS_KEY = '@biblioteca:loan_requests';
const LOANS_KEY = '@biblioteca:active_loans';

const parseRequest = (r: any): LoanRequest => ({
  ...r,
  requestDate: r.requestDate ? new Date(r.requestDate) : new Date(),
});

const parseLoan = (l: any): ActiveLoan => ({
  ...l,
  loanDate: l.loanDate ? new Date(l.loanDate) : new Date(),
  dueDate: l.dueDate ? new Date(l.dueDate) : new Date(),
  returnDate: l.returnDate ? new Date(l.returnDate) : undefined,
});

export const loanRequestService = {
  // ── Requisições ─────────────────────────────────────────────────────────

  async getAllRequests(): Promise<LoanRequest[]> {
    try {
      const data = await AsyncStorage.getItem(REQUESTS_KEY);
      return data ? JSON.parse(data).map(parseRequest) : [];
    } catch {
      return [];
    }
  },

  async getRequestsByUser(userId: string): Promise<LoanRequest[]> {
    const all = await this.getAllRequests();
    return all.filter(r => r.userId === userId);
  },

  async addRequest(request: LoanRequest): Promise<LoanRequest[]> {
    try {
      const all = await this.getAllRequests();
      const updated = [...all, request];
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return this.getAllRequests();
    }
  },

  async updateRequest(requestId: string, status: 'approved' | 'rejected'): Promise<LoanRequest[]> {
    try {
      const all = await this.getAllRequests();
      const updated = all.map(r =>
        r.id === requestId ? { ...r, status } : r
      );
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return this.getAllRequests();
    }
  },

  // ── Empréstimos ativos ───────────────────────────────────────────────────

  async getAllLoans(): Promise<ActiveLoan[]> {
    try {
      const data = await AsyncStorage.getItem(LOANS_KEY);
      return data ? JSON.parse(data).map(parseLoan) : [];
    } catch {
      return [];
    }
  },

  async getLoansByUser(userId: string): Promise<ActiveLoan[]> {
    const all = await this.getAllLoans();
    return all.filter(l => l.userId === userId);
  },

  async addLoan(loan: ActiveLoan): Promise<ActiveLoan[]> {
    try {
      const all = await this.getAllLoans();
      const updated = [...all, loan];
      await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return this.getAllLoans();
    }
  },

  async updateLoan(loanId: string, updates: Partial<ActiveLoan>): Promise<ActiveLoan[]> {
    try {
      const all = await this.getAllLoans();
      const updated = all.map(l =>
        l.id === loanId ? { ...l, ...updates } : l
      );
      await AsyncStorage.setItem(LOANS_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return this.getAllLoans();
    }
  },
};