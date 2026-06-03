import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActiveLoan, LoanRequest } from '../types';
import { styles } from './styles/UserLoans.styles';

interface Props {
  rentalRequests: LoanRequest[];
  activeLoans: ActiveLoan[];
  formatDate: (date: Date) => string;
  getDaysOverdue: (date: Date) => number;
  finePerDay: number;
  onReturnLoan: (loan: ActiveLoan) => void;
  onGoToCatalog: () => void;
}

export const UserLoansTab: React.FC<Props> = ({
  rentalRequests,
  activeLoans,
  formatDate,
  getDaysOverdue,
  finePerDay,
  onReturnLoan,
  onGoToCatalog,
}) => {
  return (
    <ScrollView style={styles.content}>
      {rentalRequests.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Pedidos de aluguel</Text>

          {rentalRequests.map((request) => (
            <View key={request.id} style={styles.loanCard}>
              <View style={styles.loanInfo}>
                <Text style={styles.loanTitle}>
                  {request.bookTitle}
                </Text>

                <Text style={styles.loanDetails}>
                  Solicitado em: {formatDate(request.requestDate)}
                </Text>

                <View style={styles.requestStatus}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color="#b45309"
                  />

                  <Text style={styles.requestStatusText}>
                    Aguardando aprovação do bibliotecário
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeLoans.filter(l => l.status === 'active').length === 0 &&
      rentalRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📚</Text>

          <Text style={styles.emptyStateText}>
            Você não tem empréstimos ativos no momento.
          </Text>

          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={onGoToCatalog}
          >
            <Text style={styles.emptyStateButtonText}>
              Explorar Catálogo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>
            Empréstimos Ativos
          </Text>

          {activeLoans
            .filter(l => l.status === 'active')
            .map((loan) => {
              const daysOverdue = getDaysOverdue(
                loan.dueDate
              );

              const isOverdue = daysOverdue > 0;

              return (
                <View
                  key={loan.id}
                  style={[
                    styles.loanCard,
                    isOverdue &&
                      styles.overdueLoanCard,
                  ]}
                >
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanTitle}>
                      {loan.bookTitle}
                    </Text>

                    <Text style={styles.loanDetails}>
                      Emprestado em:{' '}
                      {formatDate(loan.loanDate)}
                    </Text>

                    <Text
                      style={[
                        styles.loanDueDate,
                        isOverdue &&
                          styles.overdueDueDate,
                      ]}
                    >
                      {isOverdue
                        ? `⚠️ Vencido há ${daysOverdue} dia(s)`
                        : `Prazo: ${formatDate(
                            loan.dueDate
                          )}`}
                    </Text>

                    {isOverdue && (
                      <Text style={styles.fineText}>
                        Multa: R${' '}
                        {(
                          daysOverdue *
                          finePerDay
                        ).toFixed(2)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.returnButton}
                    onPress={() =>
                      onReturnLoan(loan)
                    }
                  >
                    <Text
                      style={styles.returnButtonText}
                    >
                      Devolver
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      )}

      {activeLoans.filter(l => l.status === 'returned')
        .length > 0 && (
        <View style={styles.returnedSection}>
          <Text style={styles.sectionTitle}>
            Histórico de Devoluções
          </Text>

          {activeLoans
            .filter(l => l.status === 'returned')
            .map((loan) => (
              <View
                key={loan.id}
                style={styles.historyCard}
              >
                <Text style={styles.historyTitle}>
                  {loan.bookTitle}
                </Text>

                <Text style={styles.historyDate}>
                  Devolvido em:{' '}
                  {formatDate(
                    loan.returnDate ||
                      new Date()
                  )}
                </Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
};