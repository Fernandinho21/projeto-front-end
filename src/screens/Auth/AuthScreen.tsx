import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppRole, User } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onLogin: (user: User, role: AppRole) => void;
};

type LoginAccount = {
  role: AppRole;
  code: string;
  password: string;
  name: string;
  email: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const accounts: LoginAccount[] = [
  {
    role: 'user',
    code: 'LEITOR01',
    password: '123456',
    name: 'Leitor',
    email: 'leitor01@biblioteca.local',
    title: 'Leitor',
    description: 'Solicitar aluguel de livros e acompanhar seus pedidos.',
    icon: 'book-outline',
  },
  {
    role: 'librarian',
    code: 'BIB01',
    password: '456123',
    name: 'Bibliotecário',
    email: 'bib01@biblioteca.local',
    title: 'Bibliotecário',
    description: 'Aprovar pedidos, controlar devoluções e organizar o acervo.',
    icon: 'library-outline',
  },
  {
    role: 'admin',
    code: 'ADM01',
    password: '763824',
    name: 'Administrador ADM01',
    email: 'adm01@biblioteca.local',
    title: 'Administrador',
    description: 'Gerenciar cadastro de livros e dados administrativos.',
    icon: 'shield-checkmark-outline',
  },
];

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [loginCode, setLoginCode] = useState('');
  const [password, setPassword] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  const visibleAccounts = accounts.filter(
    (account) => account.role !== 'admin' || showAdmin
  );

  const selectedAccount =
    accounts.find((account) => account.role === selectedRole) ?? accounts[0];

  const handleLogin = () => {
    const code = loginCode.trim().toUpperCase();

    if (!code || !password) {
      Alert.alert('Campos obrigatorios', 'Informe login e senha para entrar.');
      return;
    }

    if (code !== selectedAccount.code || password !== selectedAccount.password) {
      Alert.alert('Acesso negado', 'Login ou senha incorretos para este perfil.');
      return;
    }

    const user: User = {
      id: selectedAccount.code,
      name: selectedAccount.name,
      email: selectedAccount.email,
      phone: '',
      registrationDate: new Date(),
      activeLoans: selectedAccount.role === 'user' ? 0 : undefined,
    };

    onLogin(user, selectedAccount.role);
  };

  const fillDemoCredentials = () => {
    setLoginCode(selectedAccount.code);
    setPassword(selectedAccount.password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoBubble}>
              <Ionicons name="library" size={40} color="#0f172a" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.kicker}>Biblioteca Mobile</Text>
              <Text style={styles.title}>Selecione seu perfil.</Text>
            </View>
          </View>

          <Text style={styles.label}>Perfil</Text>
          <View style={styles.roles}>
            {visibleAccounts.map((account) => {
              const isSelected = selectedRole === account.role;
              return (
                <TouchableOpacity
                  key={account.role}
                  style={[styles.roleCard, isSelected && styles.roleCardActive]}
                  onPress={() => {
                    setSelectedRole(account.role);
                    setLoginCode('');
                    setPassword('');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleIcon}>
                    <Ionicons
                      name={account.icon}
                      size={22}
                      color={isSelected ? '#ffffff' : '#2563eb'}
                    />
                  </View>
                  <View style={styles.roleText}>
                    <Text
                      style={[
                        styles.roleTitle,
                        isSelected && styles.roleTitleActive,
                      ]}
                    >
                      {account.title}
                    </Text>
                    <Text
                      style={[
                        styles.roleDescription,
                        isSelected && styles.roleDescriptionActive,
                      ]}
                    >
                      {account.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? '#ffffff' : '#94a3b8'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.loginPanel}>
            <Text style={styles.label}>Login</Text>
            <TextInput
              style={styles.input}
              value={loginCode}
              onChangeText={setLoginCode}
              placeholder="Digite seu login"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />

            <TouchableOpacity style={styles.helperButton} onPress={fillDemoCredentials}>
              <Ionicons name="key-outline" size={16} color="#2563eb" />
              <Text style={styles.helperButtonText}>Preencher credencial de teste</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <Ionicons name="log-in-outline" size={20} color="#ffffff" />
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.adminRevealButton}
            onPress={() => {
              setShowAdmin((current) => !current);
              if (selectedRole === 'admin') {
                setSelectedRole('user');
                setLoginCode('');
                setPassword('');
              }
            }}
          >
            <Text style={styles.adminRevealText}>
              {showAdmin ? 'Ocultar perfil administrativo' : 'Area interna'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',    
    alignItems: 'center',     
    paddingHorizontal: 20,    
    paddingVertical: 15,      
    backgroundColor: '#ffffff', 
    borderRadius: 15,
    marginBottom: 10,          
  },
  logoBubble: {
    width: 70,                
    height: 70,               
    borderRadius: 15,         
    backgroundColor: '#f8fafc', 
    alignItems: 'center',     
    justifyContent: 'center',  
    marginRight: 15,          
  },
  heroText: {
    flex: 1,                  
    justifyContent: 'center', 
  },
  kicker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  label: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    marginLeft: 4,
  },
  roles: {
    gap: 10,
    marginBottom: 14,
  },
  roleCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  roleCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  roleTitleActive: {
    color: '#ffffff',
  },
  roleDescription: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
  roleDescriptionActive: {
    color: '#dbeafe',
  },
  loginPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  helperButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginBottom: 10,
  },
  helperButtonText: {
    color: '#2563eb',
    fontWeight: '800',
  },
  loginButton: {
    minHeight: 52,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  adminRevealButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  adminRevealText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
});
