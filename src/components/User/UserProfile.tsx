import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import { User, UserProfile, ActiveLoan } from '../../types';
import { styles } from '../styles/UserProfile.styles';
interface Props {
  user: User;
  profile: UserProfile;
  activeLoans: ActiveLoan[];
  formatDate: (date: Date) => string;
  onLogout: () => void;
}

export const UserProfileTab: React.FC<Props> = ({
  user,
  profile,
  activeLoans,
  formatDate,
  onLogout,
}) => {
  return (
    <ScrollView style={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          {profile.photoUri ? (
            <Image
              source={{ uri: profile.photoUri }}
              style={styles.profileAvatarImage}
            />
          ) : (
            <Text style={styles.profileAvatarText}>
              {profile.nickname
                .slice(0, 1)
                .toUpperCase()}
            </Text>
          )}
        </View>

        <Text style={styles.profileName}>
          {profile.nickname}
        </Text>

        <Text style={styles.profileEmail}>
          {user.email}
        </Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>
          Informações Pessoais
        </Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>
            Email
          </Text>
          <Text style={styles.infoValue}>
            {user.email}
          </Text>
        </View>

        {user.phone && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Telefone
            </Text>

            <Text style={styles.infoValue}>
              {user.phone}
            </Text>
          </View>
        )}

        {user.registrationDate && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Membro desde
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(
                user.registrationDate
              )}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>
          Estatísticas
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {
                activeLoans.filter(
                  l => l.status === 'active'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Empréstimos Ativos
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {
                activeLoans.filter(
                  l => l.status === 'returned'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Livros Devolvidos
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            Editar Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutFullButton}
          onPress={onLogout}
        >
          <Text
            style={
              styles.logoutFullButtonText
            }
          >
            Sair da Conta
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};