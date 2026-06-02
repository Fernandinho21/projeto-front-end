import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthScreen } from './src/screens/Auth/AuthScreen';
import { RegisterScreen } from './src/screens/Auth/Registerscreen';
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { LibrarianApp } from './src/screens/Librarian/LibrarianApp';
import { UserApp } from './src/screens/User/UserApp';
import { AppRole, User } from './src/types';
 
type Screen = 'auth' | 'register';
 
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('auth');
 
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);
 
  const handleLogin = (userData: User, userRole: AppRole) => {
    setUser(userData);
    setRole(userRole);
  };
 
  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setScreen('auth');
  };
 
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Carregando biblioteca...</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }
 
  if (!user || !role) {
    if (screen === 'register') {
      return (
        <>
          <RegisterScreen
            onBack={() => setScreen('auth')}
            onRegistered={() => setScreen('auth')}
          />
          <StatusBar style="dark" />
        </>
      );
    }
 
    return (
      <>
        <AuthScreen
          onLogin={handleLogin}
          onNavigateToRegister={() => setScreen('register')}
        />
        <StatusBar style="dark" />
      </>
    );
  }
 
  if (role === 'admin') {
    return (
      <>
        <HomeScreen user={user} onLogout={handleLogout} />
        <StatusBar style="light" />
      </>
    );
  }
 
  if (role === 'librarian') {
    return (
      <>
        <LibrarianApp user={user} onLogout={handleLogout} />
        <StatusBar style="dark" />
      </>
    );
  }
 
  return (
    <>
      <UserApp user={user} onLogout={handleLogout} />
      <StatusBar style="dark" />
    </>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 16,
  },
});