import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
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
});