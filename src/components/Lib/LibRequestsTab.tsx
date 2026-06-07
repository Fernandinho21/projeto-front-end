import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanRequest } from '../../types'; // Ajuste o caminho dos tipos conforme seu projeto

interface LibrarianRequestsTabProps {
  pendingRequests: LoanRequest[];
  processedRequests: LoanRequest[];
  isProcessing: boolean;
  formatDate: (date: Date) => string;
  onApproveRequest: (request: LoanRequest) => void;
  onRejectRequest: (request: LoanRequest) => void;
}

export const LibrarianRequestsTab: React.FC<LibrarianRequestsTabProps> = ({
  pendingRequests,
  processedRequests,
  isProcessing,
  formatDate,
  onApproveRequest,
  onRejectRequest,
}) => {
  return (
    <ScrollView style={styles.content}>
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>✅</Text>
          <Text style={styles.emptyStateText}>Nenhuma requisição pendente</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>
            Solicitações Pendentes ({pendingRequests.length})
          </Text>
          {pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestBookTitle}>{request.bookTitle}</Text>
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
                  onPress={() => onApproveRequest(request)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-outline" size={25} color="#fff" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => onRejectRequest(request)}
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
          {processedRequests.map((request) => (
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
  );
};

// Estilos extraídos do seu LibrarianApp para garantir o mesmo visual
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flex: 1,
    gap: 4,
  },
  requestBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  requestUserName: {
    fontSize: 14,
    color: '#475569',
  },
  requestDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processedSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  approvedCard: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  historyTitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
});