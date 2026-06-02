import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppRole, User } from '../../types';
import { userService } from '../../services/userservice';

type Props = {
  onLogin: (user: User, role: AppRole) => void;
  onNavigateToRegister: () => void;
};

type RoleOption = {
  role: AppRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const roleOptions: RoleOption[] = [
  {
    role: 'user',
    title: 'Leitor',
    description: 'Solicitar aluguel de livros e acompanhar seus pedidos.',
    icon: 'book-outline',
  },
  {
    role: 'librarian',
    title: 'Bibliotecario',
    description: 'Aprovar pedidos, controlar devolucoes e organizar o acervo.',
    icon: 'library-outline',
  },
  {
    role: 'admin',
    title: 'Administrador',
    description: 'Gerenciar cadastro de livros e dados administrativos.',
    icon: 'shield-checkmark-outline',
  },
];

export const AuthScreen: React.FC<Props> = ({ onLogin, onNavigateToRegister }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [loginCode, setLoginCode] = useState('');
  const [password, setPassword] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const visibleRoles = roleOptions.filter(
    (r) => r.role !== 'admin' || showAdmin
  );

  const handleLogin = async () => {
    setErrorMessage('');
    const code = loginCode.trim().toUpperCase();

    if (!code || !password) {
      setErrorMessage('Informe o login e a senha para entrar.');
      return;
    }

    setLoading(true);
    const found = await userService.findByCredentials(code, password, selectedRole);
    setLoading(false);

    if (!found) {
      setErrorMessage('Login ou senha incorretos. Verifique suas credenciais e tente novamente.');
      return;
    }

    const user: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      registrationDate: found.registrationDate,
      activeLoans: found.activeLoans,
    };

    onLogin(user, found.role);
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
              <Ionicons name="library" size={34} color="#0f172a" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.kicker}>Biblioteca Mobile</Text>
              <Text style={styles.title}>Escolha sua chave de entrada</Text>
              <Text style={styles.subtitle}>
                Cada perfil tem login e senha proprios. Entre para solicitar,
                aprovar ou organizar livros.
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Perfil</Text>
          <View style={styles.roles}>
            {visibleRoles.map((option) => {
              const isSelected = selectedRole === option.role;
              return (
                <TouchableOpacity
                  key={option.role}
                  style={[styles.roleCard, isSelected && styles.roleCardActive]}
                  onPress={() => {
                    setSelectedRole(option.role);
                    setLoginCode('');
                    setPassword('');
                    setErrorMessage('');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleIcon}>
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={isSelected ? '#ffffff' : '#2563eb'}
                    />
                  </View>
                  <View style={styles.roleText}>
                    <Text style={[styles.roleTitle, isSelected && styles.roleTitleActive]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.roleDescription, isSelected && styles.roleDescriptionActive]}>
                      {option.description}
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
            <Text style={styles.panelTitle}>Credenciais obrigatorias</Text>

            <Text style={styles.label}>Login</Text>
            <TextInput
              style={[styles.input, errorMessage ? styles.inputError : null]}
              value={loginCode}
              onChangeText={(v) => { setLoginCode(v); setErrorMessage(''); }}
              placeholder="Digite seu login"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={[styles.input, errorMessage ? styles.inputError : null]}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorMessage(''); }}
              placeholder="Digite sua senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />

            {errorMessage !== '' && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {selectedRole !== 'admin' && (
              <TouchableOpacity
                style={styles.helperButton}
                onPress={onNavigateToRegister}
              >
                <Ionicons name="person-add-outline" size={16} color="#2563eb" />
                <Text style={styles.helperButtonText}>Criar uma conta</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Ionicons name="log-in-outline" size={20} color="#ffffff" />
              <Text style={styles.loginButtonText}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
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
                setErrorMessage('');
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
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  logoBubble: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#facc15', borderWidth: 3, borderColor: '#0f172a' },
  heroText: { flex: 1 },
  kicker: { color: '#2563eb', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { marginTop: 6, color: '#0f172a', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 8, color: '#475569', fontSize: 15, lineHeight: 22 },
  label: { color: '#1e293b', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  roles: { gap: 10, marginBottom: 14 },
  roleCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', padding: 12, gap: 10 },
  roleCardActive: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  roleIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  roleText: { flex: 1 },
  roleTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900' },
  roleTitleActive: { color: '#ffffff' },
  roleDescription: { marginTop: 4, color: '#64748b', fontSize: 12, lineHeight: 17 },
  roleDescriptionActive: { color: '#dbeafe' },
  loginPanel: { borderRadius: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  panelTitle: { color: '#0f172a', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  input: { minHeight: 50, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  inputError: { borderColor: '#dc2626' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, color: '#dc2626', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  helperButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, backgroundColor: '#eff6ff', marginBottom: 10 },
  helperButtonText: { color: '#2563eb', fontWeight: '800' },
  loginButton: { minHeight: 52, borderRadius: 8, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loginButtonDisabled: { backgroundColor: '#475569' },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  adminRevealButton: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 14, paddingVertical: 8 },
  adminRevealText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
});