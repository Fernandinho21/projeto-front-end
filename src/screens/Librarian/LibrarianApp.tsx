import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { bookStorageService } from '../../services/Bookstorageservice';
import { loanRequestService } from '../../services/Loanrequestservice';
import { Book, User, LoanRequest, ActiveLoan, UserProfile } from '../../types';
import { loadUserProfile, saveUserProfile } from '../../services/profileStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibrarianHeader } from '../../components/Lib/LibHeader';
import { LibrarianNavigation } from '../../components/Lib/LibNavBar';
import { LibrarianRequestsTab } from '../../components/Lib/LibRequestsTab';
import { LibrarianLoansTab } from '../../components/Lib/LibLoansTab';
import { LibrarianInventoryTab } from '../../components/Lib/LibInventory';

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
  const totalPendentes = pendingRequests.length;
  //Contador de empréstimos atrasados e ativos
  const loansEmAndamento = activeLoans.filter(l => l.status === 'active');
  const totalLoansAtivos = loansEmAndamento.length;
  const loansAtrasados = loansEmAndamento.filter(l => getDaysOverdue(l.dueDate) > 0);
  const totalLoansAtrasados = loansAtrasados.length;

  const filteredBooks = books.filter(
    b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <LibrarianHeader 
        user={user}
        profile={profile}
        onLogout={onLogout}
        onProfileChange={handleProfileChange}
      />

      <LibrarianNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRequestsCount={totalPendentes}
        overdueLoansCount={totalLoansAtrasados}
      />

      {activeTab === 'requests' && (
        <LibrarianRequestsTab
          pendingRequests={pendingRequests}
          processedRequests={processedRequests}
          isProcessing={isProcessing}
          formatDate={formatDate}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
        />
      )}

      {activeTab === 'loans' && (
        <LibrarianLoansTab
          activeLoans={activeLoans}
          isProcessing={isProcessing}
          getDaysOverdue={getDaysOverdue}
          formatDate={formatDate}
          onRenewLoan={handleRenewLoan}
          onProcessReturn={handleProcessReturn}
        />
      )}

      {activeTab === 'inventory' && (
        <LibrarianInventoryTab books={books} />
      )}
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#2083e7',
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2083e7',
  },
  returnActionButton: {
    backgroundColor: '#4caf50',
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