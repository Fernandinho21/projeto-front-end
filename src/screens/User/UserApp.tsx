import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialBooks, CATALOG_SECTIONS } from '../../data/mockBooks';
import {
  Book,
  AvailabilityFilter,
  User,
  ActiveLoan,
  UserProfile,
  LoanRequest,
} from '../../types';
import { BookDetailScreen } from '../Admin/BookDetailScreen';
import { ProfileMenu } from '../../components/ProfileMenu';
import { loadUserProfile, saveUserProfile } from '../../services/profileStorage';

interface Props {
  user: User;
  onLogout: () => void;
}

type UserTab = 'catalog' | 'my-loans' | 'profile';

const LOAN_DAYS = 14;
const FINE_PER_DAY = 1.0;

export const UserApp: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<UserTab>('catalog');
  const [profile, setProfile] = useState<UserProfile>({
    nickname: user.name,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookDetail, setShowBookDetail] = useState(false);
  const [rentalRequests, setRentalRequests] = useState<LoanRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);

  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDaysOverdue = (dueDate: Date) => {
    const today = startOfDay(new Date());
    const due = startOfDay(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Filtrar livros baseado na busca e disponibilidade
  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        book =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    if (availabilityFilter === 'available') {
      filtered = filtered.filter(book => book.availableCopies > 0);
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter(book => book.availableCopies === 0);
    }

    return filtered;
  }, [books, searchQuery, availabilityFilter]);

  useEffect(() => {
    loadUserProfile(user.id, user.name).then(setProfile);
  }, [user.id, user.name]);

  const handleProfileChange = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    saveUserProfile(user.id, nextProfile).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel salvar o perfil agora.');
    });
  };

  const handleBorrow = (book: Book) => {
    const hasPendingRequest = rentalRequests.some(
      (request) => request.bookId === book.id && request.status === 'pending'
    );

    if (hasPendingRequest) {
      Alert.alert('Pedido em analise', 'Voce ja pediu este livro para aluguel.');
      return;
    }

    Alert.alert(
      'Solicitar aluguel',
      `Enviar pedido para alugar "${book.title}"? O bibliotecario precisa aprovar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: () => {
            setRentalRequests((currentRequests) => [
              ...currentRequests,
              {
                id: `request_${Date.now()}`,
                bookId: book.id,
                bookTitle: book.title,
                userId: user.id,
                userName: profile.nickname,
                requestDate: new Date(),
                status: 'pending',
              },
            ]);
            Alert.alert('Pedido enviado', 'Sua solicitacao foi enviada para analise.');
            setShowBookDetail(false);
          },
        },
      ]
    );
  };

  const handleLegacyBorrow = (book: Book) => {
    const newLoan: ActiveLoan = {
      id: `loan_${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      copyNumber: book.totalCopies - book.availableCopies + 1,
      userId: user.id,
      userName: user.name,
      loanDate: new Date(),
      dueDate: new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000),
      status: 'active',
      isOverdue: false,
      fine: 0,
    };

    setActiveLoans([...activeLoans, newLoan]);
    setBooks(
      books.map(b =>
        b.id === book.id
          ? { ...b, availableCopies: b.availableCopies - 1 }
          : b
      )
    );
    setShowBookDetail(false);
  };

  const handleReturnLoan = (loan: ActiveLoan) => {
    Alert.alert(
      'Confirmar Devolução',
      `Tem certeza que deseja devolver "${loan.bookTitle}"?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Devolver',
          onPress: () => {
            setActiveLoans(
              activeLoans.map(l =>
                l.id === loan.id
                  ? { ...l, status: 'returned', returnDate: new Date() }
                  : l
              )
            );
            setBooks(
              books.map(b =>
                b.id === loan.bookId
                  ? { ...b, availableCopies: b.availableCopies + 1 }
                  : b
              )
            );
            Alert.alert('Sucesso', 'Livro devolvido com sucesso!');
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const renderCatalogSection = ({ item }: { item: any }) => {
    const sectionBooks = books
      .filter(item.match)
      .slice(0, item.limit || undefined);

    if (sectionBooks.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{item.title}</Text>
        <FlatList
          data={sectionBooks}
          renderItem={({ item: book }) => (
            <TouchableOpacity
              style={styles.bookCard}
              onPress={() => {
                setSelectedBook(book);
                setShowBookDetail(true);
              }}
            >
              {book.coverUrl && (
                <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
              )}
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
                <Text style={styles.bookAvailability}>
                  {book.availableCopies > 0
                    ? `${book.availableCopies} disponível(is)`
                    : 'Indisponível'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  if (showBookDetail && selectedBook) {
    return (
      <BookDetailScreen
        book={selectedBook}
        userRole="user"
        onClose={() => setShowBookDetail(false)}
        onBorrow={handleBorrow}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <ProfileMenu
            name={user.name}
            email={user.email}
            roleLabel="Leitor"
            profile={profile}
            onChangeProfile={handleProfileChange}
          />
          <View style={styles.headerTextBlock}>
            <Text style={styles.welcomeText}>Bem-vindo, {profile.nickname}!</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === 'catalog' && styles.activeNavButton]}
          onPress={() => setActiveTab('catalog')}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={activeTab === 'catalog' ? '#ffffff' : '#666666'}
          />
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'catalog' && styles.activeNavButtonText,
            ]}
          >
            Catalogo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeTab === 'my-loans' && styles.activeNavButton]}
          onPress={() => setActiveTab('my-loans')}
        >
          <Ionicons
            name="reader-outline"
            size={16}
            color={activeTab === 'my-loans' ? '#ffffff' : '#666666'}
          />
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'my-loans' && styles.activeNavButtonText,
            ]}
          >
            Pedidos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeTab === 'profile' && styles.activeNavButton]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={activeTab === 'profile' ? '#ffffff' : '#666666'}
          />
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'profile' && styles.activeNavButtonText,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'catalog' && (
        <ScrollView style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Buscar por título ou autor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            {(['all', 'available', 'unavailable'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  availabilityFilter === filter && styles.activeFilterButton,
                ]}
                onPress={() => setAvailabilityFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    availabilityFilter === filter && styles.activeFilterButtonText,
                  ]}
                >
                  {filter === 'all'
                    ? 'Todos'
                    : filter === 'available'
                    ? 'Disponíveis'
                    : 'Indisponíveis'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {searchQuery ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Resultados da Busca ({filteredBooks.length})
              </Text>
              <FlatList
                data={filteredBooks}
                renderItem={({ item: book }) => (
                  <TouchableOpacity
                    style={styles.bookCard}
                    onPress={() => {
                      setSelectedBook(book);
                      setShowBookDetail(true);
                    }}
                  >
                    {book.coverUrl && (
                      <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
                    )}
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={2}>
                        {book.title}
                      </Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>
                        {book.author}
                      </Text>
                      <Text style={styles.bookAvailability}>
                        {book.availableCopies > 0
                          ? `${book.availableCopies} disponível(is)`
                          : 'Indisponível'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          ) : (
            <FlatList
              data={CATALOG_SECTIONS}
              renderItem={renderCatalogSection}
              keyExtractor={item => item.title}
              scrollEnabled={false}
            />
          )}
        </ScrollView>
      )}

      {activeTab === 'my-loans' && (
        <ScrollView style={styles.content}>
          {rentalRequests.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Pedidos de aluguel</Text>
              {rentalRequests.map((request) => (
                <View key={request.id} style={styles.loanCard}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanTitle}>{request.bookTitle}</Text>
                    <Text style={styles.loanDetails}>
                      Solicitado em: {formatDate(request.requestDate)}
                    </Text>
                    <View style={styles.requestStatus}>
                      <Ionicons name="time-outline" size={15} color="#b45309" />
                      <Text style={styles.requestStatusText}>
                        Aguardando aprovacao do bibliotecario
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeLoans.filter(l => l.status === 'active').length === 0 && rentalRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateText}>
                Você não tem empréstimos ativos no momento.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setActiveTab('catalog')}
              >
                <Text style={styles.emptyStateButtonText}>
                  Explorar Catálogo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>Empréstimos Ativos</Text>
              {activeLoans
                .filter(l => l.status === 'active')
                .map(loan => {
                  const daysOverdue = getDaysOverdue(loan.dueDate);
                  const isOverdue = daysOverdue > 0;

                  return (
                    <View
                      key={loan.id}
                      style={[
                        styles.loanCard,
                        isOverdue && styles.overdueLoanCard,
                      ]}
                    >
                      <View style={styles.loanInfo}>
                        <Text style={styles.loanTitle}>{loan.bookTitle}</Text>
                        <Text style={styles.loanDetails}>
                          Emprestado em: {formatDate(loan.loanDate)}
                        </Text>
                        <Text
                          style={[
                            styles.loanDueDate,
                            isOverdue && styles.overdueDueDate,
                          ]}
                        >
                          {isOverdue
                            ? `⚠️ Vencido há ${daysOverdue} dia(s)`
                            : `Prazo: ${formatDate(loan.dueDate)}`}
                        </Text>
                        {isOverdue && (
                          <Text style={styles.fineText}>
                            Multa: R$ {(daysOverdue * FINE_PER_DAY).toFixed(2)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.returnButton}
                        onPress={() => handleReturnLoan(loan)}
                      >
                        <Text style={styles.returnButtonText}>Devolver</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </View>
          )}

          {activeLoans.filter(l => l.status === 'returned').length > 0 && (
            <View style={styles.returnedSection}>
              <Text style={styles.sectionTitle}>Histórico de Devoluções</Text>
              {activeLoans
                .filter(l => l.status === 'returned')
                .map(loan => (
                  <View key={loan.id} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>{loan.bookTitle}</Text>
                    <Text style={styles.historyDate}>
                      Devolvido em: {formatDate(loan.returnDate || new Date())}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'profile' && (
        <ScrollView style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              {profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>
                  {profile.nickname.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.profileName}>{profile.nickname}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            {user.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            )}
            {user.registrationDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Membro desde</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.registrationDate)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {activeLoans.filter(l => l.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>Empréstimos Ativos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {activeLoans.filter(l => l.status === 'returned').length}
                </Text>
                <Text style={styles.statLabel}>Livros Devolvidos</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutFullButton}
              onPress={onLogout}
            >
              <Text style={styles.logoutFullButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeNavButton: {
    backgroundColor: '#0066cc',
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeNavButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  searchContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  bookCover: {
    width: 80,
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  bookInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  bookAvailability: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loanCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overdueLoanCard: {
    borderLeftColor: '#ff6b6b',
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  loanDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  requestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  requestStatusText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  loanDueDate: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
  },
  overdueDueDate: {
    color: '#ff6b6b',
  },
  fineText: {
    fontSize: 11,
    color: '#ff6b6b',
    marginTop: 4,
    fontWeight: '600',
  },
  returnButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  returnedSection: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    color: '#0066cc',
    fontSize: 34,
    fontWeight: '900',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutFullButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutFullButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
