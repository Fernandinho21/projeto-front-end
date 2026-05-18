import { initialBooks } from '../data/mockBooks';
import { Book } from '../types';

// Simula uma API de livros externa (ex: Google Books API)
export const searchExternalBook = async (isbn: string): Promise<Book | null> => {
  // Simula busca em API externa
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simula alguns livros conhecidos
  const externalBooks: Record<string, Partial<Book>> = {
    "9788535914841": {
      title: "O Alquimista",
      author: "Paulo Coelho",
      publisher: "Paralela",
      year: 1988,
      category: "Ficção"
    },
    "9788578270698": {
      title: "A Arte da Guerra",
      author: "Sun Tzu",
      publisher: "Martins Fontes",
      year: -500,
      category: "Estratégia"
    },
    "9788532521018": {
      title: "O Monge e o Executivo",
      author: "James C. Hunter",
      publisher: "Sextante",
      year: 1998,
      category: "Autoajuda"
    }
  };
  
  const found = externalBooks[isbn];
  if (found) {
    return {
      id: Date.now().toString(),
      title: found.title!,
      author: found.author!,
      publisher: found.publisher!,
      year: found.year!,
      isbn: isbn,
      totalCopies: 1,
      availableCopies: 1,
      location: "Novo",
      category: found.category!,
      coverUrl: undefined
    };
  }
  
  return null;
};

// Adiciona livro ao catálogo local
export const addBookToCatalog = (
  books: Book[],
  newBook: Book,
  quantidade: number
): Book[] => {
  const existingIndex = books.findIndex(b => b.isbn === newBook.isbn);
  
  if (existingIndex !== -1) {
    const updatedBooks = [...books];
    updatedBooks[existingIndex] = {
      ...updatedBooks[existingIndex],
      totalCopies: updatedBooks[existingIndex].totalCopies + quantidade,
      availableCopies: updatedBooks[existingIndex].availableCopies + quantidade
    };
    return updatedBooks;
  } else {
    return [...books, { ...newBook, totalCopies: quantidade, availableCopies: quantidade }];
  }
};