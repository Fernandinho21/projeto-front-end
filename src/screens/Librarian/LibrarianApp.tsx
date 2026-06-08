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
  
});