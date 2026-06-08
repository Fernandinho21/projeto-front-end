import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { bookStorageService } from '../../services/Bookstorageservice';
import { loanRequestService } from '../../services/Loanrequestservice';
import {
  Book,
  User,
  ActiveLoan,
  UserProfile,
  LoanRequest,
} from '../../types';
import { BookDetailScreen } from '../Admin/BookDetailScreen';
import { loadUserProfile, saveUserProfile } from '../../services/profileStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserCatalogTab } from '../../components/User/UserCatalog';
import { UserNavbar } from '../../components/User/UserHeader';
import { UserLoansTab } from '../../components/User/Loans'
import { UserProfileTab } from '../../components/User/UserProfile';

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
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookDetail, setShowBookDetail] = useState(false);
  const [rentalRequests, setRentalRequests] = useState<LoanRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
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

  useEffect(() => {
    loadUserProfile(user.id, user.name).then(setProfile);
  }, [user.id, user.name]);

  useEffect(() => {
    Promise.all([
      bookStorageService.getAll(),
      loanRequestService.getRequestsByUser(user.id),
      loanRequestService.getLoansByUser(user.id),
    ]).then(([loadedBooks, loadedRequests, loadedLoans]) => {
      setBooks(loadedBooks);
      setRentalRequests(loadedRequests);
      setActiveLoans(loadedLoans);
      setLoadingData(false);
    });
  }, [user.id]);

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
          onPress: async () => {
            const newRequest: LoanRequest = {
              id: `request_${Date.now()}`,
              bookId: book.id,
              bookTitle: book.title,
              userId: user.id,
              userName: profile.nickname,
              requestDate: new Date(),
              status: 'pending',
            };
            const updated = await loanRequestService.addRequest(newRequest);
            setRentalRequests(updated.filter(r => r.userId === user.id));
            Alert.alert('Pedido enviado', 'Sua solicitacao foi enviada para analise.');
            setShowBookDetail(false);
          },
        },
      ]
    );
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
      <View>
        <UserNavbar
          user={user} 
          profile={profile}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onLogout={onLogout}
          onChangeProfile={handleProfileChange}
        />

      </View>

      {activeTab === 'catalog' && (
        <UserCatalogTab
          books={books}
          onSelectBook={(book) => {
            setSelectedBook(book);
            setShowBookDetail(true);
          }}
        />
      )}

      {activeTab === 'my-loans' && (
        <UserLoansTab
          rentalRequests={rentalRequests}
          activeLoans={activeLoans}
          formatDate={formatDate}
          getDaysOverdue={getDaysOverdue}
          finePerDay={FINE_PER_DAY}
          onReturnLoan={handleReturnLoan}
          onGoToCatalog={() => setActiveTab('catalog')}
        />
      )}

      {activeTab === 'profile' && (
         <UserProfileTab
          user={user}
          profile={profile}
          activeLoans={activeLoans}
          formatDate={formatDate}
          onLogout={onLogout}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});