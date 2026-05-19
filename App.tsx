import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initialBooks, CATALOG_SECTIONS } from './src/data/mockBooks';
import { AddBookScreen } from './src/screens/Admin/AddBookScreen';
import {
  ActiveLoan,
  AvailabilityFilter,
  Book,
  LoanRequest,
} from './src/types';

const CURRENT_USER = {
  id: 'u1',
  name: 'Maria Silva',
};

const LOAN_DAYS = 14;
const FINE_PER_DAY = 1.0;

type Tab = 'catalog' | 'loans' | 'admin';

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getDaysOverdue = (dueDate: Date) => {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const enrichLoan = (loan: ActiveLoan): ActiveLoan => {
  if (loan.status === 'returned') {
    return { ...loan, isOverdue: false, fine: 0 };
  }
  const daysOverdue = getDaysOverdue(loan.dueDate);
  const isOverdue = daysOverdue > 0;
  return {
    ...loan,
    isOverdue,
    fine: isOverdue ? daysOverdue * FINE_PER_DAY : 0,
    status: isOverdue ? 'overdue' : loan.status === 'overdue' ? 'active' : loan.status,
  };
};

export default function App() {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [showAddBook, setShowAddBook] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(books.map((b) => b.category))).sort(),
    [books]
  );

  const enrichedLoans = useMemo(() => loans.map(enrichLoan), [loans]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.category.toLowerCase().includes(term);

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && book.availableCopies > 0) ||
        (availabilityFilter === 'unavailable' && book.availableCopies === 0);

      const matchesCategory = !categoryFilter || book.category === categoryFilter;

      return matchesSearch && matchesAvailability && matchesCategory;
    });
  }, [books, search, availabilityFilter, categoryFilter]);

  const hasPendingRequest = (bookId: string) =>
    requests.some(
      (r) =>
        r.bookId === bookId &&
        r.userId === CURRENT_USER.id &&
        r.status === 'pending'
    );

  const requestLoan = (book: Book) => {
    if (book.availableCopies === 0) {
      Alert.alert('Indisponível', 'Não há exemplares disponíveis no momento.');
      return;
    }
    if (hasPendingRequest(book.id)) {
      Alert.alert('Aguardando', 'Você já tem uma solicitação pendente para este livro.');
      return;
    }

    Alert.alert(
      'Solicitar empréstimo',
      `Deseja solicitar o empréstimo de "${book.title}"? A biblioteca precisa aprovar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: () => {
            const newRequest: LoanRequest = {
              id: `req-${Date.now()}`,
              bookId: book.id,
              bookTitle: book.title,
              userId: CURRENT_USER.id,
              userName: CURRENT_USER.name,
              requestDate: new Date(),
              status: 'pending',
            };
            setRequests((prev) => [...prev, newRequest]);
            Alert.alert('Enviado', 'Sua solicitação foi enviada ao bibliotecário.');
          },
        },
      ]
    );
  };

  const approveRequest = (request: LoanRequest) => {
    const book = books.find((b) => b.id === request.bookId);
    if (!book || book.availableCopies === 0) {
      Alert.alert('Erro', 'Não há exemplares disponíveis para aprovar este empréstimo.');
      return;
    }

    const loanDate = new Date();
    const dueDate = addDays(loanDate, LOAN_DAYS);
    const newLoan: ActiveLoan = {
      id: `loan-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      copyNumber: book.totalCopies - book.availableCopies + 1,
      userId: request.userId,
      userName: request.userName,
      loanDate,
      dueDate,
      status: 'active',
      isOverdue: false,
      fine: 0,
    };

    setLoans((prev) => [...prev, newLoan]);
    setBooks((prev) =>
      prev.map((b) =>
        b.id === book.id ? { ...b, availableCopies: b.availableCopies - 1 } : b
      )
    );
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'approved' } : r))
    );
    Alert.alert('Aprovado', `Empréstimo aprovado. Devolução até ${formatDate(dueDate)}.`);
  };

  const rejectRequest = (request: LoanRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'rejected' } : r))
    );
    Alert.alert('Reprovado', 'A solicitação foi reprovada.');
  };

  const returnLoan = (loan: ActiveLoan) => {
    const updated = enrichLoan(loan);
    Alert.alert(
      'Devolver livro',
      updated.isOverdue
        ? `Este empréstimo está atrasado. Multa: R$ ${updated.fine.toFixed(2)}`
        : `Confirmar devolução de "${loan.bookTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Devolver',
          onPress: () => {
            setLoans((prev) =>
              prev.map((l) =>
                l.id === loan.id
                  ? { ...l, status: 'returned', returnDate: new Date(), isOverdue: false, fine: 0 }
                  : l
              )
            );
            setBooks((prev) =>
              prev.map((b) =>
                b.id === loan.bookId
                  ? { ...b, availableCopies: Math.min(b.availableCopies + 1, b.totalCopies) }
                  : b
              )
            );
          },
        },
      ]
    );
  };

  const handleAddBook = (newBook: Book) => {
    setBooks((prev) => [...prev, { ...newBook, coverUrl: newBook.coverUrl ?? `https://picsum.photos/200/300?random=${newBook.id}` }]);
  };

  const renderBookCard = ({ item }: { item: Book }) => {
    const available = item.availableCopies > 0;
    const pending = hasPendingRequest(item.id);

    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => requestLoan(item)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.coverUrl ?? `https://picsum.photos/200/300?random=${item.id}` }}
          style={styles.cover}
        />
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={[styles.availability, available ? styles.available : styles.unavailable]}>
          {pending ? 'Solicitação pendente' : available ? 'Disponível' : 'Indisponível'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCatalog = () => (
    <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por título, autor ou categoria..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {(['all', 'available', 'unavailable'] as AvailabilityFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              availabilityFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setAvailabilityFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                availabilityFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter === 'all' ? 'Todos' : filter === 'available' ? 'Disponíveis' : 'Indisponíveis'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <TouchableOpacity
          style={[styles.chip, !categoryFilter && styles.chipActive]}
          onPress={() => setCategoryFilter(null)}
        >
          <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>Todas</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, categoryFilter === cat && styles.chipActive]}
            onPress={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
          >
            <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {CATALOG_SECTIONS.map((section) => {
        let sectionBooks = filteredBooks.filter(section.match);
        if (section.limit) {
          sectionBooks = sectionBooks.slice(0, section.limit);
        }
        if (sectionBooks.length === 0) return null;

        return (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
              data={sectionBooks}
              keyExtractor={(item) => `${section.title}-${item.id}`}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              renderItem={renderBookCard}
            />
          </View>
        );
      })}

      {filteredBooks.length === 0 && (
        <Text style={styles.emptyText}>Nenhum livro encontrado com os filtros atuais.</Text>
      )}
    </ScrollView>
  );

  const renderLoans = () => {
    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const activeLoans = enrichedLoans.filter((l) => l.status !== 'returned');

    return (
      <ScrollView style={styles.flex}>
        <Text style={styles.screenTitle}>Painel do Bibliotecário</Text>

        <Text style={styles.subsectionTitle}>
          Solicitações pendentes ({pendingRequests.length})
        </Text>
        {pendingRequests.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma solicitação pendente.</Text>
        ) : (
          pendingRequests.map((request) => (
            <View key={request.id} style={styles.loanCard}>
              <Text style={styles.loanBookTitle}>{request.bookTitle}</Text>
              <Text style={styles.loanMeta}>Usuário: {request.userName}</Text>
              <Text style={styles.loanMeta}>
                Solicitado em: {formatDate(request.requestDate)}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => approveRequest(request)}
                >
                  <Text style={styles.actionButtonText}>Aprovar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => rejectRequest(request)}
                >
                  <Text style={styles.actionButtonText}>Reprovar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.subsectionTitle}>
          Empréstimos ativos ({activeLoans.length})
        </Text>
        {activeLoans.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum empréstimo ativo.</Text>
        ) : (
          activeLoans.map((loan) => (
            <View key={loan.id} style={styles.loanCard}>
              <Text style={styles.loanBookTitle}>{loan.bookTitle}</Text>
              <Text style={styles.loanMeta}>Usuário: {loan.userName}</Text>
              <Text style={styles.loanMeta}>Empréstimo: {formatDate(loan.loanDate)}</Text>
              <Text style={styles.loanMeta}>Devolução: {formatDate(loan.dueDate)}</Text>
              {loan.isOverdue && (
                <View style={styles.overdueBox}>
                  <Text style={styles.overdueLabel}>ATRASADO</Text>
                  <Text style={styles.overdueFine}>
                    Multa: R$ {loan.fine.toFixed(2)} ({getDaysOverdue(loan.dueDate)} dia(s))
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.returnButton]}
                onPress={() => returnLoan(loan)}
              >
                <Text style={styles.actionButtonText}>Registrar devolução</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  if (showAddBook) {
    return (
      <SafeAreaView style={styles.safe}>
        <AddBookScreen
          onClose={() => setShowAddBook(false)}
          onAddBook={handleAddBook}
        />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biblioteca</Text>
        <Text style={styles.headerUser}>Olá, {CURRENT_USER.name}</Text>
      </View>

      <View style={styles.content}>
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'loans' && renderLoans()}
        {activeTab === 'admin' && (
          <View style={styles.adminPanel}>
            <Text style={styles.screenTitle}>Administração</Text>
            <TouchableOpacity style={styles.adminButton} onPress={() => setShowAddBook(true)}>
              <Text style={styles.adminButtonText}>+ Adicionar livro ao acervo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {(
          [
            { key: 'catalog', label: 'Catálogo' },
            { key: 'loans', label: 'Empréstimos' },
            { key: 'admin', label: 'Admin' },
          ] as { key: Tab; label: string }[]
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.key === 'loans' &&
                requests.filter((r) => r.status === 'pending').length > 0 &&
                ` (${requests.filter((r) => r.status === 'pending').length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#141414',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e50914',
  },
  headerUser: {
    color: '#aaa',
    marginTop: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#e50914',
  },
  filterButtonText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  chipsScroll: {
    marginBottom: 16,
    maxHeight: 44,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  chipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  chipText: {
    color: '#ccc',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookCard: {
    width: '48%',
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: 180,
    backgroundColor: '#333',
  },
  bookTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  bookAuthor: {
    color: '#aaa',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  availability: {
    fontSize: 11,
    fontWeight: '600',
    padding: 8,
    paddingTop: 4,
  },
  available: {
    color: '#46d369',
  },
  unavailable: {
    color: '#e87c03',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 15,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e50914',
    marginTop: 8,
    marginBottom: 10,
  },
  loanCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  loanBookTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  loanMeta: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 2,
  },
  overdueBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#3d0c0c',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#e50914',
  },
  overdueLabel: {
    color: '#e50914',
    fontWeight: 'bold',
    fontSize: 14,
  },
  overdueFine: {
    color: '#ff6b6b',
    marginTop: 4,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#46d369',
  },
  rejectButton: {
    backgroundColor: '#555',
  },
  returnButton: {
    backgroundColor: '#3498db',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#141414',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderTopWidth: 3,
    borderTopColor: '#e50914',
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  adminPanel: {
    flex: 1,
    paddingTop: 8,
  },
  adminButton: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

