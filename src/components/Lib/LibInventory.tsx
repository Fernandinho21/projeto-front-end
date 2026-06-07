import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Book } from '../../types'; // Ajuste o caminho dos tipos conforme seu projeto
import { Ionicons } from '@expo/vector-icons';

interface LibrarianInventoryTabProps {
  books: Book[];
}

export const LibrarianInventoryTab: React.FC<LibrarianInventoryTabProps> = ({ books }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Realiza o filtro dos livros internamente baseado no que o bibliotecário digita
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    
    const query = searchQuery.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  return (
    <ScrollView style={styles.content}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#aaa" /> 
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar livro..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <Text style={styles.sectionTitle}>
        Acervo ({filteredBooks.length} livro(s))
      </Text>

      {filteredBooks.map((book) => (
        <View key={book.id} style={styles.inventoryCard}>
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryTitle}>{book.title}</Text>
            <Text style={styles.inventoryAuthor}>{book.author}</Text>
            
            <View style={styles.inventoryStats}>
              <View style={styles.inventoryStat}>
                <Text style={styles.inventoryStatLabel}>Total:</Text>
                <Text style={styles.inventoryStatValue}>
                  {book.totalCopies}
                </Text>
              </View>
              
              <View style={styles.inventoryStat}>
                <Text style={styles.inventoryStatLabel}>Disponíveis:</Text>
                <Text
                  style={[
                    styles.inventoryStatValue,
                    book.availableCopies === 0 && styles.inventoryStatValueZero,
                  ]}
                >
                  {book.availableCopies}
                </Text>
              </View>
              
              <View style={styles.inventoryStat}>
                <Text style={styles.inventoryStatLabel}>Emprestados:</Text>
                <Text style={styles.inventoryStatValue}>
                  {book.totalCopies - book.availableCopies}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// Estilos extraídos e padronizados do seu LibrarianApp original
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 10,
    marginBottom: 8,
    marginTop: 10
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderColor: '#ddd',
    flex: 1,
    color: '#000', 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  inventoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  inventoryAuthor: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  inventoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  inventoryStat: {
    alignItems: 'center',
    flex: 1,
  },
  inventoryStatLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  inventoryStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  inventoryStatValueZero: {
    color: '#ef4444',
  },
});