export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  edition: string;
  pages: number;
  available: boolean;
};

export type ActiveLoan = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  withdrawalDate: string;
  returnDate: string;
};
