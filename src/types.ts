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

export type ActiveLoan = {
  id: string;
  bookId: string;
  copyNumber: number;
  userId: string;
  userName: string;
  loanDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned' | 'overdue';
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: Date;
  activeLoans: number;
};
