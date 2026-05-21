import { Book } from '../types';

type GoogleBooksResponse = {
  items?: {
    volumeInfo?: {
      title?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      industryIdentifiers?: { type?: string; identifier?: string }[];
      categories?: string[];
      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
      };
      pageCount?: number;
      description?: string;
    };
  }[];
};

const localFallbackBooks: Record<string, Partial<Book>> = {
  '9788535914841': {
    title: 'O Alquimista',
    author: 'Paulo Coelho',
    publisher: 'Paralela',
    year: 1988,
    category: 'Ficcao',
  },
  '9788578270698': {
    title: 'A Arte da Guerra',
    author: 'Sun Tzu',
    publisher: 'Martins Fontes',
    year: -500,
    category: 'Estrategia',
  },
  '9788532521018': {
    title: 'O Monge e o Executivo',
    author: 'James C. Hunter',
    publisher: 'Sextante',
    year: 1998,
    category: 'Autoajuda',
  },
};

const normalizeIsbn = (isbn: string) => isbn.replace(/[^0-9Xx]/g, '').toUpperCase();

const coverByIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const normalizeImageUrl = (url?: string) => {
  if (!url) return undefined;
  return url.replace(/^http:\/\//, 'https://');
};

export const searchExternalBook = async (isbn: string): Promise<Book | null> => {
  const cleanIsbn = normalizeIsbn(isbn);

  if (!cleanIsbn) {
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
    );
    const data = (await response.json()) as GoogleBooksResponse;
    const volume = data.items?.[0]?.volumeInfo;

    if (volume?.title) {
      const identifier =
        volume.industryIdentifiers?.find((item) => item.identifier === cleanIsbn)
          ?.identifier ?? cleanIsbn;
      const year = Number.parseInt(volume.publishedDate?.slice(0, 4) ?? '', 10);

      return {
        id: `isbn-${identifier}-${Date.now()}`,
        title: volume.title,
        author: volume.authors?.join(', ') ?? 'Autor nao informado',
        publisher: volume.publisher ?? 'Editora nao informada',
        year: Number.isNaN(year) ? new Date().getFullYear() : year,
        isbn: identifier,
        totalCopies: 1,
        availableCopies: 1,
        location: 'Novo',
        category: volume.categories?.[0] ?? 'Geral',
        coverUrl:
          normalizeImageUrl(volume.imageLinks?.thumbnail) ?? coverByIsbn(cleanIsbn),
        pageCount: volume.pageCount,
        summary: volume.description,
      };
    }
  } catch {
    // Offline or blocked API: keep the form usable with the local fallback below.
  }

  const fallback = localFallbackBooks[cleanIsbn];

  if (!fallback?.title) {
    return null;
  }

  return {
    id: `isbn-${cleanIsbn}-${Date.now()}`,
    title: fallback.title,
    author: fallback.author ?? 'Autor nao informado',
    publisher: fallback.publisher ?? 'Editora nao informada',
    year: fallback.year ?? new Date().getFullYear(),
    isbn: cleanIsbn,
    totalCopies: 1,
    availableCopies: 1,
    location: 'Novo',
    category: fallback.category ?? 'Geral',
    coverUrl: coverByIsbn(cleanIsbn),
  };
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
