import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../types';
import { initialBooks } from '../data/mockBooks';

const BOOKS_KEY = '@biblioteca:books';
const VERSION_KEY = '@biblioteca:books_version';
const CURRENT_VERSION = '5'; // Incrementar aqui força reload das capas

export const bookStorageService = {
  async getAll(): Promise<Book[]> {
    try {
      // Verifica se precisa resetar por atualização de versão
      const version = await AsyncStorage.getItem(VERSION_KEY);
      if (version !== CURRENT_VERSION) {
        // Nova versão: salva os initialBooks com capas atualizadas
        // e preserva livros extras que o admin adicionou
        const stored = await AsyncStorage.getItem(BOOKS_KEY);
        const savedBooks: Book[] = stored ? JSON.parse(stored) : [];

        // Pega apenas livros que NÃO são do initialBooks (adicionados pelo admin)
        const initialIds = new Set(initialBooks.map(b => b.id));
        const adminBooks = savedBooks.filter(b => !initialIds.has(b.id));

        // Junta initialBooks atualizados + livros do admin
        const merged = [...initialBooks, ...adminBooks];
        await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(merged));
        await AsyncStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return merged;
      }

      const data = await AsyncStorage.getItem(BOOKS_KEY);
      return data ? JSON.parse(data) : initialBooks;
    } catch {
      return initialBooks;
    }
  },

  async addBook(newBook: Book): Promise<Book[]> {
    try {
      const books = await this.getAll();
      const existingIndex = books.findIndex((b) => b.isbn === newBook.isbn);

      let updatedBooks: Book[];
      if (existingIndex !== -1) {
        updatedBooks = books.map((b, i) =>
          i === existingIndex
            ? {
                ...b,
                totalCopies: b.totalCopies + newBook.totalCopies,
                availableCopies: b.availableCopies + newBook.availableCopies,
                coverUrl: newBook.coverUrl ?? b.coverUrl,
              }
            : b
        );
      } else {
        updatedBooks = [...books, newBook];
      }

      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
      return updatedBooks;
    } catch {
      return this.getAll();
    }
  },

  async updateBook(updatedBook: Book): Promise<Book[]> {
    try {
      const books = await this.getAll();
      const updatedBooks = books.map((b) =>
        b.id === updatedBook.id ? updatedBook : b
      );
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
      return updatedBooks;
    } catch {
      return this.getAll();
    }
  },

  async removeBook(bookId: string): Promise<Book[]> {
    try {
      const books = await this.getAll();
      const updatedBooks = books.filter((b) => b.id !== bookId);
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
      return updatedBooks;
    } catch {
      return this.getAll();
    }
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(BOOKS_KEY);
    await AsyncStorage.removeItem(VERSION_KEY);
  },
};