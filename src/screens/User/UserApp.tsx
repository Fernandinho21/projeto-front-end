import React, { useEffect, useState } from 'react';
import {StyleSheet,  Alert} from 'react-native';
import { initialBooks, CATALOG_SECTIONS } from '../../data/mockBooks';
import { Book, User, ActiveLoan, UserProfile, LoanRequest} from '../../types';
import { BookDetailScreen } from '../Admin/BookDetailScreen';
import { loadUserProfile, saveUserProfile } from '../../services/profileStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NetflixCatalog } from '../../components/Catalog';
import { UserLoansTab } from '../../components/Loans';
import { UserProfileTab } from '../../components/Profiles';
import { UserNavbar } from '../../components/UserHeader';
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


  useEffect(() => {
    loadUserProfile(user.id, user.name).then(setProfile);
  }, [user.id, user.name]);

  const handleProfileChange = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    saveUserProfile(user.id, nextProfile).catch(() => {
      Alert.alert('Aviso', 'Perfil salvo com sucesso!');
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
      <UserNavbar
        user={user}
        profile={profile}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onLogout={onLogout}
        onChangeProfile={handleProfileChange}
      />

      {activeTab === 'catalog' && (
        <NetflixCatalog
        books={books}
        sections={CATALOG_SECTIONS}
        onSelectBook={(book) => { setSelectedBook(book); setShowBookDetail(true); }}
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
});
