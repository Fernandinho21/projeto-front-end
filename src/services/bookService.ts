import { Book } from '../types';

// ── Open Library API (gratuita, sem chave, sem limite) ──────────────────────

type OpenLibraryResponse = {
  title?: string;
  authors?: { key: string }[];
  publishers?: string[];
  publish_date?: string;
  subjects?: string[];
  number_of_pages?: number;
  description?: string | { value: string };
};

type OpenLibraryAuthor = {
  name?: string;
};

const normalizeIsbn = (isbn: string) =>
  isbn.replace(/[^0-9Xx]/g, '').toUpperCase();

const coverByIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const getDescription = (desc?: string | { value: string }): string | undefined => {
  if (!desc) return undefined;
  if (typeof desc === 'string') return desc;
  return desc.value;
};

export const searchExternalBook = async (isbn: string): Promise<Book | null> => {
  const cleanIsbn = normalizeIsbn(isbn);

  if (!cleanIsbn) return null;

  try {
    // Busca dados do livro na Open Library
    const res = await fetch(
      `https://openlibrary.org/isbn/${cleanIsbn}.json`
    );

    if (!res.ok) throw new Error(`Status ${res.status}`);

    const data: OpenLibraryResponse = await res.json();

    if (!data.title) return null;

    // Busca nome do autor se disponível
    let authorName = 'Autor não informado';
    if (data.authors && data.authors.length > 0) {
      try {
        const authorRes = await fetch(
          `https://openlibrary.org${data.authors[0].key}.json`
        );
        if (authorRes.ok) {
          const authorData: OpenLibraryAuthor = await authorRes.json();
          if (authorData.name) authorName = authorData.name;
        }
      } catch {
        // ignora erro do autor
      }
    }

    const year = data.publish_date
      ? parseInt(data.publish_date.replace(/\D/g, '').slice(-4), 10)
      : new Date().getFullYear();

    return {
      id: `isbn-${cleanIsbn}-${Date.now()}`,
      title: data.title,
      author: authorName,
      publisher: data.publishers?.[0] ?? 'Editora não informada',
      year: isNaN(year) ? new Date().getFullYear() : year,
      isbn: cleanIsbn,
      totalCopies: 1,
      availableCopies: 1,
      location: 'Novo',
      category: data.subjects?.[0] ?? 'Geral',
      coverUrl: coverByIsbn(cleanIsbn),
      pageCount: data.number_of_pages,
      summary: getDescription(data.description),
    };
  } catch {
    return null;
  }
};

export const addBookToCatalog = (
  books: Book[],
  newBook: Book,
  quantity: number
): Book[] => {
  const existingIndex = books.findIndex((book) => book.isbn === newBook.isbn);

  if (existingIndex !== -1) {
    const updatedBooks = [...books];
    updatedBooks[existingIndex] = {
      ...updatedBooks[existingIndex],
      totalCopies: updatedBooks[existingIndex].totalCopies + quantity,
      availableCopies: updatedBooks[existingIndex].availableCopies + quantity,
    };
    return updatedBooks;
  }

  return [
    ...books,
    { ...newBook, totalCopies: quantity, availableCopies: quantity },
  ];
};