import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Book } from '../../types'; 
import { NetflixCatalog } from './NetflixCatalogTypo'; // O componente de carrossel 

interface UserCatalogTabProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

type AvailabilityFilter = 'all' | 'available' | 'unavailable';

export const UserCatalogTab: React.FC<UserCatalogTabProps> = ({ books, onSelectBook }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  // Filtra a lista global de livros baseado na busca textual e nos filtros por pílula
  const filteredBooks = useMemo(() => {
    let result = books;

    // Filtro por texto (Título ou Autor)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    // Filtro pelas Pílulas de Disponibilidade
    if (availabilityFilter === 'available') {
      result = result.filter((book) => book.availableCopies > 0);
    } else if (availabilityFilter === 'unavailable') {
      result = result.filter((book) => book.availableCopies === 0);
    }

    return result;
  }, [books, searchQuery, availabilityFilter]);

  const carrosselSections = useMemo(() => {
    const sections = [];

    sections.push({
      title: 'Disponíveis',
      match: (book: Book) => book.availableCopies > 0,
      limit: 10,
    });

    const categories = [...new Set(filteredBooks.map((b) => b.category).filter(Boolean))];
    categories.forEach((cat) => {
      sections.push({
        title: cat,
        match: (book: Book) => book.category === cat,
      });
    });

    return sections;
  }, [filteredBooks]);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <NetflixCatalog
          books={filteredBooks}
          sections={carrosselSections}
          onSelectBook={onSelectBook}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 14,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  pillText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});