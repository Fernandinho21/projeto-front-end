import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookStorageService } from '../../services/Bookstorageservice';
import { loanRequestService } from '../../services/Loanrequestservice';
import { Book, User, LoanRequest, ActiveLoan, UserProfile } from '../../types';
import { ProfileMenu } from '../../components/ProfileMenu';
import { loadUserProfile, saveUserProfile } from '../../services/profileStorage';

interface Props {
  user: User;
  onLogout: () => void;
}

type LibrarianTab = 'requests' | 'loans' | 'inventory';

export const LibrarianApp: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<LibrarianTab>('requests');
  const [profile, setProfile] = useState<UserProfile>({
    nickname: user.name,
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadUserProfile(user.id, user.name).then(setProfile);
  }, [user.id, user.name]);

  useEffect(() => {
    Promise.all([
      bookStorageService.getAll(),
      loanRequestService.getAllRequests(),
      loanRequestService.getAllLoans(),
    ]).then(([loadedBooks, loadedRequests, loadedLoans]) => {
      setBooks(loadedBooks);
      setLoanRequests(loadedRequests);
      setActiveLoans(loadedLoans);
    });
  }, []);

  const handleProfileChange = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    saveUserProfile(user.id, nextProfile).catch(() => {
      Alert.alert('Erro', 'Nao foi possivel salvar o perfil agora.');
    });
  };

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

  const formatDate = (date: Date) =>
    date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  // Aprovar requisição de empréstimo
  const handleApproveRequest = async (request: LoanRequest) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newLoan: ActiveLoan = {
        id: `loan_${Date.now()}`,
        bookId: request.bookId,
        bookTitle: request.bookTitle,
        copyNumber: 1,
        userId: request.userId,
        userName: request.userName,
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        isOverdue: false,
        fine: 0,
      };

      const updatedLoans = await loanRequestService.addLoan(newLoan);
      const updatedRequests = await loanRequestService.updateRequest(request.id, 'approved');
      setActiveLoans(updatedLoans);
      setLoanRequests(updatedRequests);

      const updatedBook = books.find(b => b.id === request.bookId && b.availableCopies > 0);
      if (updatedBook) {
        const newBooks = await bookStorageService.updateBook({ ...updatedBook, availableCopies: updatedBook.availableCopies - 1 });
        setBooks(newBooks);
      }

      Alert.alert('Sucesso', `Empréstimo aprovado para ${request.userName}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Rejeitar requisição de empréstimo
  const handleRejectRequest = async (request: LoanRequest) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedRequests = await loanRequestService.updateRequest(request.id, 'rejected');
      setLoanRequests(updatedRequests);

      Alert.alert('Feito', `Requisição rejeitada para ${request.userName}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Processar devolução
  const handleProcessReturn = async (loan: ActiveLoan) => {
    Alert.alert(
      'Confirmar Devolução',
      `Confirmar que "${loan.bookTitle}" foi devolvido por ${loan.userName}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 500));

              const updatedLoans = await loanRequestService.updateLoan(loan.id, { status: 'returned', returnDate: new Date() });
              setActiveLoans(updatedLoans);

              const returnedBook = books.find(b => b.id === loan.bookId);
              if (returnedBook) {
                const newBooks = await bookStorageService.updateBook({ ...returnedBook, availableCopies: returnedBook.availableCopies + 1 });
                setBooks(newBooks);
              }

              Alert.alert('Sucesso', 'Devolução registrada com sucesso!');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Renovar empréstimo
  const handleRenewLoan = async (loan: ActiveLoan) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const renewedDueDate = new Date(loan.dueDate);
      renewedDueDate.setDate(renewedDueDate.getDate() + 14);

      setActiveLoans(
        activeLoans.map(l =>
          l.id === loan.id ? { ...l, dueDate: renewedDueDate } : l
        )
      );

      Alert.alert('Sucesso', 'Empréstimo renovado por mais 14 dias!');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingRequests = loanRequests.filter(r => r.status === 'pending');
  const processedRequests = loanRequests.filter(r => r.status !== 'pending');

  const filteredBooks = books.filter(
    b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <ProfileMenu
            name={user.name}
            email={user.email}
            roleLabel="Bibliotecario"
            profile={profile}
            onChangeProfile={handleProfileChange}
          />
          <View style={styles.headerTextBlock}>
            <Text style={styles.welcomeText}>Bibliotecario</Text>
            <Text style={styles.userEmail}>{profile.nickname}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'requests' && styles.activeNavButton,
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.navButtonContent}>
            <Ionicons
              name="clipboard-outline"
              size={16}
              color={activeTab === 'requests' ? '#ffffff' : '#666666'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeTab === 'requests' && styles.activeNavButtonText,
              ]}
            >
              Requisicoes
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === 'loans' && styles.activeNavButton]}
          onPress={() => setActiveTab('loans')}
        >
          <View style={styles.navButtonContent}>
            <Ionicons
              name="albums-outline"
              size={16}
              color={activeTab === 'loans' ? '#ffffff' : '#666666'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeTab === 'loans' && styles.activeNavButtonText,
              ]}
            >
              Alugueis
            </Text>
            {activeLoans.filter(l => l.isOverdue).length > 0 && (
              <View style={[styles.badge, styles.alertBadge]}>
                <Text style={styles.badgeText}>
                  {activeLoans.filter(l => l.isOverdue).length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'inventory' && styles.activeNavButton,
          ]}
          onPress={() => setActiveTab('inventory')}
        >
          <Ionicons
            name="cube-outline"
            size={16}
            color={activeTab === 'inventory' ? '#ffffff' : '#666666'}
          />
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'inventory' && styles.activeNavButtonText,
            ]}
          >
            Acervo
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' && (
        <ScrollView style={styles.content}>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>✅</Text>
              <Text style={styles.emptyStateText}>
                Nenhuma requisição pendente
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>
                Requisições Pendentes ({pendingRequests.length})
              </Text>
              {pendingRequests.map(request => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestBookTitle}>
                      {request.bookTitle}
                    </Text>
                    <Text style={styles.requestUserName}>
                      Solicitado por: {request.userName}
                    </Text>
                    <Text style={styles.requestDate}>
                      {formatDate(request.requestDate)}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveRequest(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.approveButtonText}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.rejectButtonText}>✕</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {processedRequests.length > 0 && (
            <View style={styles.processedSection}>
              <Text style={styles.sectionTitle}>Histórico</Text>
              {processedRequests.map(request => (
                <View
                  key={request.id}
                  style={[
                    styles.historyCard,
                    request.status === 'approved' && styles.approvedCard,
                  ]}
                >
                  <Text style={styles.historyTitle}>{request.bookTitle}</Text>
                  <Text style={styles.historyStatus}>
                    {request.status === 'approved' ? '✓ Aprovada' : '✕ Rejeitada'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'loans' && (
        <ScrollView style={styles.content}>
          <View>
            <Text style={styles.sectionTitle}>Empréstimos Ativos</Text>

            {activeLoans.filter(l => l.status === 'active' || l.status === 'overdue').length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text style={styles.emptyStateText}>
                  Nenhum empréstimo ativo
                </Text>
              </View>
            ) : (
              activeLoans
                .filter(l => l.status === 'active' || l.status === 'overdue')
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
                        <Text style={styles.loanUserName}>
                          {loan.userName}
                        </Text>
                        <Text style={styles.loanDetails}>
                          {formatDate(loan.loanDate)} - Vence: {formatDate(loan.dueDate)}
                        </Text>
                        {isOverdue && (
                          <Text style={styles.overdueWarning}>
                            ⚠️ Atrasado há {daysOverdue} dia(s) - Multa: R$
                            {(daysOverdue * 1.0).toFixed(2)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.loanActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleRenewLoan(loan)}
                          disabled={isProcessing}
                        >
                          <Text style={styles.actionButtonText}>🔄</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            styles.returnActionButton,
                          ]}
                          onPress={() => handleProcessReturn(loan)}
                          disabled={isProcessing}
                        >
                          <Text style={styles.actionButtonText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
            )}
          </View>

          {activeLoans.filter(l => l.status === 'returned').length > 0 && (
            <View style={styles.returnedSection}>
              <Text style={styles.sectionTitle}>Histórico de Devoluções</Text>
              {activeLoans
                .filter(l => l.status === 'returned')
                .map(loan => (
                  <View key={loan.id} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>{loan.bookTitle}</Text>
                    <Text style={styles.historySubtitle}>
                      {loan.userName} - Devolvido em{' '}
                      {formatDate(loan.returnDate || new Date())}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'inventory' && (
        <ScrollView style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Buscar livro..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Text style={styles.sectionTitle}>
            Acervo ({filteredBooks.length} livro(s))
          </Text>

          {filteredBooks.map(book => (
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
                        book.availableCopies === 0 &&
                          styles.inventoryStatValueZero,
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
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    gap: 3,
  },
  activeNavButton: {
    backgroundColor: '#0066cc',
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeNavButtonText: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#4caf50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  alertBadge: {
    backgroundColor: '#ff6b6b',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  requestInfo: {
    flex: 1,
  },
  requestBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestUserName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 11,
    color: '#999',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4caf50',
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processedSection: {
    marginTop: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  approvedCard: {
    borderLeftColor: '#4caf50',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: 11,
    color: '#666',
  },
  historySubtitle: {
    fontSize: 11,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
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
  loanUserName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  loanDetails: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  overdueWarning: {
    fontSize: 11,
    color: '#ff6b6b',
    fontWeight: '600',
    marginTop: 4,
  },
  loanActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f0f7ff',
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  returnActionButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  returnedSection: {
    marginTop: 20,
  },
  searchContainer: {
    marginBottom: 12,
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
  inventoryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inventoryAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  inventoryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  inventoryStat: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  inventoryStatLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  inventoryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  inventoryStatValueZero: {
    color: '#ff6b6b',
  },
});