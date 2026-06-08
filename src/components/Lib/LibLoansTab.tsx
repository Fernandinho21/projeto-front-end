import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveLoan } from '../../types'; 
interface LibrarianLoansTabProps {
  activeLoans: ActiveLoan[];
  isProcessing: boolean;
  getDaysOverdue: (dueDate: Date) => number;
  formatDate: (date: Date) => string;
  onRenewLoan: (loan: ActiveLoan) => void;
  onProcessReturn: (loan: ActiveLoan) => void;
}

export const LibrarianLoansTab: React.FC<LibrarianLoansTabProps> = ({
  activeLoans,
  isProcessing,
  getDaysOverdue,
  formatDate,
  onRenewLoan,
  onProcessReturn,
}) => {
  // Filtra empréstimos ativos/atrasados e devolvidos
  const currentLoans = activeLoans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const returnedLoans = activeLoans.filter((l) => l.status === 'returned');

  return (
    <ScrollView style={styles.content}>
      <View>
        <Text style={styles.sectionTitle}>Empréstimos Ativos</Text>

        {currentLoans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateText}>Nenhum empréstimo ativo</Text>
          </View>
        ) : (
          currentLoans.map((loan) => {
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
                  <Text style={styles.loanUserName}>{loan.userName}</Text>
                  <Text style={styles.loanDetails}>
                    {formatDate(loan.loanDate)} - Vence: {formatDate(loan.dueDate)}
                  </Text>
                  {isOverdue && (
                    <Text style={styles.overdueWarning}>
                      ⚠️ Atrasado há {daysOverdue} dia(s) - Multa: R${' '}
                      {(daysOverdue * 1.0).toFixed(2)}
                    </Text>
                  )}
                </View>
                <View style={styles.loanActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onRenewLoan(loan)}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name="reload-outline"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.returnActionButton,
                    ]}
                    onPress={() => onProcessReturn(loan)}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={25}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {returnedLoans.length > 0 && (
        <View style={styles.returnedSection}>
          <Text style={styles.sectionTitle}>Histórico de Devoluções</Text>
          {returnedLoans.map((loan) => (
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
  );
};

const styles = StyleSheet.create({
    content: {
    flex: 1,
    padding: 12,
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
  returnedSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 11,
    color: '#666',
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
})