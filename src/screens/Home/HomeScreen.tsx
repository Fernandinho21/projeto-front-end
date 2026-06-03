import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddBookScreen } from '../Admin/AddBookScreen';
import { bookStorageService } from '../../services/Bookstorageservice';
import { Book, User } from '../../types';

type Props = {
  user: User;
  onLogout: () => void;
};

type AdminTab = 'dashboard' | 'inventory';

export const HomeScreen: React.FC<Props> = ({ user, onLogout }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [search, setSearch] = useState("");
  const [isAddingBook, setIsAddingBook] = useState(false);

  useEffect(() => {
    bookStorageService.getAll().then((stored) => {
      setBooks(stored);
      setLoadingBooks(false);
    });
  }, []);

  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return books;

    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.category.toLowerCase().includes(term) ||
        book.isbn.toLowerCase().includes(term)
    );
  }, [books, search]);

  const stats = useMemo(() => {
    const totalCopies = books.reduce((total, book) => total + book.totalCopies, 0);
    const availableCopies = books.reduce(
      (total, book) => total + book.availableCopies,
      0
    );
    const unavailableTitles = books.filter((book) => book.availableCopies === 0).length;

    return { titles: books.length, totalCopies, availableCopies, unavailableTitles };
  }, [books]);

  const handleAddBook = async (newBook: Book) => {
    const updatedBooks = await bookStorageService.addBook(newBook);
    setBooks(updatedBooks);
  };

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookRow}>
      <Image
        source={{ uri: item.coverUrl ?? `https://picsum.photos/200/300?random=${item.id}` }}
        style={styles.cover}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookMeta} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={styles.bookMeta}>
          {item.category} | Estante {item.location}
        </Text>
        <Text
          style={[
            styles.availability,
            item.availableCopies === 0 && styles.availabilityEmpty,
          ]}
        >
          {item.availableCopies}/{item.totalCopies} copias disponiveis
        </Text>
      </View>
    </View>
  );


  if (loadingBooks) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, color: '#475569' }}>Carregando acervo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAddingBook) {
    return (
      <SafeAreaView style={styles.safe}>
        <AddBookScreen
          onClose={() => setIsAddingBook(false)}
          onAddBook={handleAddBook}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Painel administrativo</Text>
          <Text style={styles.headerTitle}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text
            style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}
          >
            Visao geral
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text
            style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}
          >
            Acervo
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dashboard' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.titles}</Text>
              <Text style={styles.statLabel}>titulos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalCopies}</Text>
              <Text style={styles.statLabel}>copias</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.availableCopies}</Text>
              <Text style={styles.statLabel}>disponiveis</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.unavailableTitles}</Text>
              <Text style={styles.statLabel}>sem estoque</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setIsAddingBook(true)}
          >
            <Text style={styles.primaryButtonText}>Adicionar livro</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Ultimos livros do acervo</Text>
          {books.slice(-4).reverse().map((book) => (
            <View key={book.id} style={styles.compactBook}>
              <Text style={styles.compactBookTitle}>{book.title}</Text>
              <Text style={styles.compactBookMeta}>
                {book.availableCopies} de {book.totalCopies} disponiveis
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por titulo, autor, categoria ou ISBN"
            placeholderTextColor="#94a3b8"
          />
          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id}
            renderItem={renderBook}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum livro encontrado.</Text>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
  },
  headerLabel: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    marginTop: 3,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  logoutButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  logoutButtonText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    backgroundColor: '#0f172a',
  },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#cbd5e1',
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  compactBook: {
    borderRadius: 8,
    backgroundColor: '#1e293b',
    padding: 14,
    marginBottom: 10,
  },
  compactBookTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  compactBookMeta: {
    marginTop: 4,
    color: '#cbd5e1',
    fontSize: 13,
  },
  searchInput: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  bookRow: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 10,
  },
  cover: {
    width: 64,
    height: 92,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  bookMeta: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  availability: {
    marginTop: 8,
    color: '#15803d',
    fontSize: 13,
    fontWeight: '900',
  },
  availabilityEmpty: {
    color: '#b91c1c',
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    color: '#cbd5e1',
  },
});