import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { ProfileMenu } from './LibProfile';

interface User { 
  name: string;
  email: string;
}

interface UserProfile {
  nickname: string;
}

interface LibrarianHeaderProps {
  user: User;
  profile: UserProfile;
  onLogout: () => void;
  onProfileChange: (nextProfile: UserProfile) => void;
}

export const LibrarianHeader: React.FC<LibrarianHeaderProps> = ({
  user,
  profile,
  onLogout,
  onProfileChange,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <ProfileMenu
          name={user.name}
          email={user.email}
          roleLabel="Bibliotecário"
          profile={profile}
          onChangeProfile={onProfileChange}
        />
        <View style={styles.headerTextBlock}>
          <Text style={styles.welcomeText}>Bibliotecário</Text>
          <Text style={styles.userEmail}>{profile.nickname}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="exit-outline" size={25} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
});