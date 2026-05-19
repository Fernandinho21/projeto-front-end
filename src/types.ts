export type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  location: string;
  category: string;
  coverUrl?: string;
};

export type LoanRequest = {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected';
};

export type ActiveLoan = {
  id: string;
  bookId: string;
  bookTitle: string;
  copyNumber: number;
  userId: string;
  userName: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned' | 'overdue';
  isOverdue: boolean;
  fine: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: Date;
  activeLoans: number;
};

export type AvailabilityFilter = 'all' | 'available' | 'unavailable';
