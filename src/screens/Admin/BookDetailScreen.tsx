import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Book, ActiveLoan } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  book: Book;
  userRole?: string;
  onClose: () => void;
  onBorrow?: (book: Book) => void;
  onReturn?: (loan: ActiveLoan) => void;
}

export const BookDetailScreen: React.FC<Props> = ({
  book,
  userRole = 'user',
  onClose,
  onBorrow,
  onReturn,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  const handleBorrow = async () => {
    if (!onBorrow) {
      Alert.alert('Erro', 'Solicitação nao disponível');
      return;
    }

    if (book.availableCopies <= 0) {
      Alert.alert('Indisponível', 'Este livro não está disponível no momento.');
      return;
    }

    setIsLoading(true);
    try {
      // Simula delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      onBorrow(book);
      Alert.alert('Pedido enviado', 'Seu pedido de aluguel foi enviado.');
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao solicitar o aluguel.');
    } finally {
      setIsLoading(false);
    }
  };

  const canBorrow = userRole === 'user' && book.availableCopies > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Livro</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Capa do Livro */}
        <View style={styles.coverSection}>
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>📚</Text>
            </View>
          )}
        </View>

        {/* Informações Básicas */}
        <View style={styles.infoSection}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>por {book.author}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ 4.5 (128 avaliações)</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Disponíveis</Text>
              <Text style={styles.statValue}>{book.availableCopies}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{book.totalCopies}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Categoria</Text>
              <Text style={[styles.statValue, styles.statValueSmall]}>
                {book.category}
              </Text>
            </View>
          </View>
        </View>

        {/* Abas */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text
              style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}
            >
              Informações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text
              style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}
            >
              Avaliações
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo das Abas */}
        {activeTab === 'info' ? (
          <View style={styles.tabContent}>
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Editora</Text>
              <Text style={styles.detailValue}>{book.publisher}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Ano de Publicação</Text>
              <Text style={styles.detailValue}>{book.year}</Text>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>ISBN</Text>
              <Text style={styles.detailValue}>{book.isbn}</Text>
            </View>

            {book.pageCount && (
              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>Número de Páginas</Text>
                <Text style={styles.detailValue}>{book.pageCount}</Text>
              </View>
            )}

            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Localização</Text>
              <Text style={styles.detailValue}>{book.location}</Text>
            </View>

            {book.summary && (
              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>Sinopse</Text>
                <Text style={styles.detailValue}>{book.summary}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>Maria Silva</Text>
                <Text style={styles.reviewRating}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.reviewText}>
                Excelente livro! Muito bem escrito e envolvente. Recomendo para todos.
              </Text>
              <Text style={styles.reviewDate}>Há 2 dias</Text>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>João Santos</Text>
                <Text style={styles.reviewRating}>⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.reviewText}>
                Muito bom! Uma leitura rápida e interessante. Perfeito para o tema.
              </Text>
              <Text style={styles.reviewDate}>Há 1 semana</Text>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>Ana Costa</Text>
                <Text style={styles.reviewRating}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.reviewText}>
                Impecável! Superou minhas expectativas. Já estou lendo a série toda.
              </Text>
              <Text style={styles.reviewDate}>Há 10 dias</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botão de Ação */}
      <View style={styles.actionContainer}>
        {canBorrow ? (
          <TouchableOpacity
            style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
            onPress={handleBorrow}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Solicitar aluguel</Text>
            )}
          </TouchableOpacity>
        ) : userRole === 'user' && book.availableCopies === 0 ? (
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableText}>
              Livro indisponível no momento
            </Text>
            <TouchableOpacity style={styles.notifyButton}>
              <Text style={styles.notifyButtonText}>🔔 Notificar quando disponível</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={onClose}
          >
            <Text style={styles.viewButtonText}>Fechar</Text>
          </TouchableOpacity>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  coverSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: 150,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  coverPlaceholder: {
    width: 150,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 60,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ratingContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ratingText: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  statValueSmall: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#0066cc',
  },
  tabContent: {
    marginBottom: 16,
  },
  detailGroup: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  actionButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableContainer: {
    gap: 10,
  },
  unavailableText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 10,
  },
  notifyButton: {
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  notifyButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
