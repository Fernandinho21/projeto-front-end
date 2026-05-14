import type { Book } from "../types";

export const initialBooks: Book[] = [
  {
    id: "1",
    title: "Dom Casmurro",
    author: "Machado de Assis",
    isbn: "978-8535902858",
    edition: "1ª",
    pages: 208,
    available: true,
  },
  {
    id: "2",
    title: "Capitães da Areia",
    author: "Jorge Amado",
    isbn: "978-8535914841",
    edition: "12ª",
    pages: 264,
    available: true,
  },
  {
    id: "3",
    title: "O Cortiço",
    author: "Aluísio Azevedo",
    isbn: "978-8535909550",
    edition: "3ª",
    pages: 304,
    available: false,
  },
  {
    id: "4",
    title: "Vidas Secas",
    author: "Graciliano Ramos",
    isbn: "978-8526016760",
    edition: "8ª",
    pages: 176,
    available: true,
  },
  {
    id: "5",
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    isbn: "978-8535902865",
    edition: "2ª",
    pages: 256,
    available: true,
  },
];
