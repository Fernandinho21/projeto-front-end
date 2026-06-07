import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppRole } from '../../types';
import { userService } from '../../services/userservice';
import { SafeAreaView } from 'react-native-safe-area-context';
type Props = {
  onBack: () => void;
  onRegistered: () => void;
};

type RoleOption = {
  role: AppRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const registerableRoles: RoleOption[] = [
  {
    role: 'user',
    title: 'Leitor',
    description: 'Solicitar aluguel de livros e acompanhar seus pedidos.',
    icon: 'book-outline',
  },
  {
    role: 'librarian',
    title: 'Bibliotecário',
    description: 'Aprovar pedidos, controlar devoluções e organizar o acervo.',
    icon: 'library-outline',
  },
];

export const RegisterScreen: React.FC<Props> = ({ onBack, onRegistered }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const formatPhoneNumber = (text: string): string => {
    // Remove tudo o que não for número
    const cleaned = text.replace(/\D/g, '');
    
    // Limita a string de números limpos a no máximo 11 caracteres
    const limited = cleaned.slice(0, 11);

    // Formatação progressiva baseada no que o usuário digita
    if (limited.length <= 2) {
      return limited.length > 0 ? `(${limited}` : limited;
    }
    if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    }
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handleRegister = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !loginCode.trim() || !password || !confirmPassword) {
      setErrorMessage('Preencha todos os campos obrigatórios para continuar.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A senha e a confirmação não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (loginCode.trim().length < 4) {
      setErrorMessage('O login deve ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);
    const result = await userService.register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      loginCode: loginCode.trim(),
      password,
      role: selectedRole,
    });
    setLoading(false);

    if (result.success) {
      const roleLabel = selectedRole === 'librarian' ? 'Bibliotecário' : 'Leitor';
      setSuccessMessage(`Cadastro concluído! Conta de ${roleLabel} criada com sucesso. Faça login para continuar.`);
      // Limpa os campos
      setName('');
      setEmail('');
      setPhone('');
      setLoginCode('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setErrorMessage(result.error ?? 'Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>Biblioteca Mobile</Text>
              <Text style={styles.title}>Criar uma conta</Text>
              <Text style={styles.subtitle}>
                Preencha seus dados para se cadastrar.
              </Text>
            </View>
          </View>

          {/* Mensagem de sucesso */}
          {successMessage !== '' && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Mensagem de erro */}
          {errorMessage !== '' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Tipo de conta</Text>
            <View style={styles.roles}>
              {registerableRoles.map((option) => {
                const isSelected = selectedRole === option.role;
                return (
                  <TouchableOpacity
                    key={option.role}
                    style={[styles.roleCard, isSelected && styles.roleCardActive]}
                    onPress={() => setSelectedRole(option.role)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.roleIcon}>
                      <Ionicons
                        name={option.icon}
                        size={20}
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
                      size={20}
                      color={isSelected ? '#ffffff' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Dados pessoais</Text>

            <Text style={styles.label}>Nome completo *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
            />

            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneNumber(text))}
              placeholder="(00) 90000-0000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={15} // Limita o tamanho do campo formatado: (11) 99999-9999
            />

            <Text style={styles.sectionTitle}>Credenciais de acesso</Text>

            <Text style={styles.label}>Login *</Text>
            <TextInput
              style={styles.input}
              value={loginCode}
              onChangeText={setLoginCode}
              placeholder="Ex: JOAO01"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>Mínimo 4 caracteres. Será usado para entrar no app.</Text>

            <Text style={styles.label}>Senha *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar senha *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Ionicons name="person-add-outline" size={20} color="#ffffff" />
              <Text style={styles.registerButtonText}>
                {loading ? 'Cadastrando...' : 'Criar conta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={onBack}>
              <Text style={styles.backLinkText}>
                {successMessage ? 'Ir para o login' : 'Já tenho uma conta'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 14, marginTop: 8 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  headerText: { flex: 1 },
  kicker: { color: '#2563eb', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { marginTop: 6, color: '#0f172a', fontSize: 26, fontWeight: '900' },
  subtitle: { marginTop: 6, color: '#475569', fontSize: 14, lineHeight: 20 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, padding: 14, marginBottom: 16 },
  successText: { flex: 1, color: '#15803d', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, padding: 14, marginBottom: 16 },
  errorText: { flex: 1, color: '#dc2626', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  form: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  sectionTitle: { color: '#0f172a', fontSize: 15, fontWeight: '900', marginBottom: 12, marginTop: 8 },
  roles: { gap: 8, marginBottom: 16 },
  roleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', padding: 12, gap: 10 },
  roleCardActive: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  roleIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  roleText: { flex: 1 },
  roleTitle: { color: '#0f172a', fontSize: 15, fontWeight: '900' },
  roleTitleActive: { color: '#ffffff' },
  roleDescription: { marginTop: 2, color: '#64748b', fontSize: 12, lineHeight: 16 },
  roleDescriptionActive: { color: '#dbeafe' },
  label: { color: '#1e293b', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  hint: { color: '#94a3b8', fontSize: 12, marginTop: -8, marginBottom: 12 },
  input: { minHeight: 50, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 14, top: 14 },
  registerButton: { minHeight: 52, borderRadius: 8, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', marginTop: 8 },
  registerButtonDisabled: { backgroundColor: '#93c5fd' },
  registerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  backLink: { alignSelf: 'center', marginTop: 14, paddingVertical: 8 },
  backLinkText: { color: '#64748b', fontSize: 14, fontWeight: '700' },
});