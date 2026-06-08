import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

// Tipagem das abas existentes
type LibrarianTab = 'requests' | 'loans' | 'inventory';

interface LibrarianNavigationProps {
  activeTab: LibrarianTab;
  setActiveTab: (tab: LibrarianTab) => void;
  pendingRequestsCount: number;
  overdueLoansCount: number;
}

export const LibrarianNavigation: React.FC<LibrarianNavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingRequestsCount,
  overdueLoansCount,
}) => {
  return (
    <View style={styles.navigation}>
      {/* Aba: Solicitações */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'requests' && styles.activeNavButton,
        ]}
        onPress={() => setActiveTab('requests')}
      >
        <Ionicons
          name="clipboard-outline"
          size={20}
          color={activeTab === 'requests' ? '#ffffff' : '#666666'}
        />
        <View style={styles.navButtonContent}>
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'requests' && styles.activeNavButtonText,
            ]}
          >
            Solicitações
          </Text>
          {pendingRequestsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Aba: Empréstimos */}
      <TouchableOpacity
        style={[styles.navButton, activeTab === 'loans' && styles.activeNavButton]}
        onPress={() => setActiveTab('loans')}
      >
        <Ionicons
          name="albums-outline"
          size={20}
          color={activeTab === 'loans' ? '#ffffff' : '#666666'}
        />
        <View style={styles.navButtonContent}>
          <Text
            style={[
              styles.navButtonText,
              activeTab === 'loans' && styles.activeNavButtonText,
            ]}
          >
            Empréstimos
          </Text>
          {overdueLoansCount > 0 && (
            <View style={[styles.badge, styles.alertBadge]}>
              <Text style={styles.badgeText}>{overdueLoansCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Aba: Acervo */}
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 'inventory' && styles.activeNavButton,
        ]}
        onPress={() => setActiveTab('inventory')}
      >
        <Ionicons
          name="cube-outline"
          size={20}
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
  );
};

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#007bff',
    borderBottomWidth: 3,
    borderBottomColor: '#0066cc',
    minWidth: 90,
    alignItems: 'center'
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#666666',
    fontSize: 12,
  },
  activeNavButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
  },
  alertBadge: {
    backgroundColor: '#ff9500', // Cor diferente para atrasados, se quiser diferenciar
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});