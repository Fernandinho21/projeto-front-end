import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { User, UserProfile } from '../types';
import { ProfileMenu } from './ProfileMenu';
import { styles } from './styles/UserHeader.styles';

type UserTab = 'catalog' | 'my-loans' | 'profile';

interface Props {
  user: User;
  profile: UserProfile;
  activeTab: UserTab;
  onChangeTab: (tab: UserTab) => void;
  onLogout: () => void;
  onChangeProfile: (profile: UserProfile) => void;
}

export const UserNavbar: React.FC<Props> = ({
  user,
  profile,
  activeTab,
  onChangeTab,
  onLogout,
  onChangeProfile,
}) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <ProfileMenu
            name={user.name}
            email={user.email}
            roleLabel="Leitor"
            profile={profile}
            onChangeProfile={onChangeProfile}
          />

          <View style={styles.headerTextBlock}>
            <Text style={styles.welcomeText}>
              Bem-vindo, {profile.nickname}!
            </Text>

            <Text style={styles.userEmail}>
              {user.email}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Ionicons
            name="exit-outline"
            size={25}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'catalog' &&
              styles.activeNavButton,
          ]}
          onPress={() =>
            onChangeTab('catalog')
          }
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={
              activeTab === 'catalog'
                ? '#fff'
                : '#666'
            }
          />

          <Text
            style={[
              styles.navButtonText,
              activeTab === 'catalog' &&
                styles.activeNavButtonText,
            ]}
          >
            Catálogo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'my-loans' &&
              styles.activeNavButton,
          ]}
          onPress={() =>
            onChangeTab('my-loans')
          }
        >
          <Ionicons
            name="reader-outline"
            size={16}
            color={
              activeTab === 'my-loans'
                ? '#fff'
                : '#666'
            }
          />

          <Text
            style={[
              styles.navButtonText,
              activeTab === 'my-loans' &&
                styles.activeNavButtonText,
            ]}
          >
            Pedidos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'profile' &&
              styles.activeNavButton,
          ]}
          onPress={() =>
            onChangeTab('profile')
          }
        >
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={
              activeTab === 'profile'
                ? '#fff'
                : '#666'
            }
          />

          <Text
            style={[
              styles.navButtonText,
              activeTab === 'profile' &&
                styles.activeNavButtonText,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};