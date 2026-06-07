import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../types';

type Props = {
  name: string;
  email: string;
  roleLabel: string;
  profile: UserProfile;
  onChangeProfile: (profile: UserProfile) => void;
};

const NICKNAME_CHANGE_INTERVAL_DAYS = 60;

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export const ProfileMenu: React.FC<Props> = ({
  name,
  email,
  roleLabel,
  profile,
  onChangeProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname || name);
  const nextNicknameChangeAt = profile.nextNicknameChangeAt
    ? new Date(profile.nextNicknameChangeAt)
    : null;

  const initials = useMemo(() => {
    const source = (profile.nickname || name).trim();
    return source ? source.slice(0, 1).toUpperCase() : 'U';
  }, [name, profile.nickname]);

  useEffect(() => {
    setNicknameDraft(profile.nickname || name);
  }, [name, profile.nickname]);

  const canChangeNickname =
    !nextNicknameChangeAt || new Date() >= nextNicknameChangeAt;

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Libere a galeria para escolher sua foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChangeProfile({ ...profile, photoUri: result.assets[0].uri });
    }
  };

  const saveNickname = () => {
    const nextNickname = nicknameDraft.trim();

    if (!nextNickname) {
      Alert.alert('Apelido invalido', 'Digite um apelido para salvar.');
      return;
    }

    if (!canChangeNickname) {
      Alert.alert(
        'Ainda nao da para trocar',
        `Voce podera alterar o apelido novamente em ${formatDate(nextNicknameChangeAt)}.`
      );
      return;
    }

    const nextChangeDate = addDays(new Date(), NICKNAME_CHANGE_INTERVAL_DAYS);
    onChangeProfile({
      ...profile,
      nickname: nextNickname,
      nextNicknameChangeAt: nextChangeDate.toISOString(),
    });
    Alert.alert('Perfil atualizado', 'Apelido salvo. A proxima troca libera em 2 meses.');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        {profile.photoUri ? (
          <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={18} color="#ffffff" />
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Meu perfil</Text>
                <Text style={styles.modalSubtitle}>{roleLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewRow}>
              <View style={styles.previewAvatar}>
                {profile.photoUri ? (
                  <Image
                    source={{ uri: profile.photoUri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.previewFallback}>
                    <Ionicons name="person" size={26} color="#1d4ed8" />
                    <Text style={styles.previewInitial}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.previewText}>
                <Text style={styles.profileName}>{profile.nickname || name}</Text>
                <Text style={styles.profileEmail}>{email}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
              <Ionicons name="camera" size={18} color="#ffffff" />
              <Text style={styles.photoButtonText}>Alterar foto</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Apelido</Text>
            <TextInput
              style={[
                styles.input,
                !canChangeNickname && styles.inputDisabled,
              ]}
              value={nicknameDraft}
              onChangeText={setNicknameDraft}
              editable={canChangeNickname}
              placeholder="Seu apelido"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.helperText}>
              {canChangeNickname
                ? 'Voce pode trocar o apelido agora. Depois disso, so daqui 2 meses.'
                : `Proxima troca em ${formatDate(nextNicknameChangeAt)}.`}
            </Text>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !canChangeNickname && styles.saveButtonDisabled,
              ]}
              onPress={saveNickname}
              disabled={!canChangeNickname}
            >
              <Text style={styles.saveButtonText}>Salvar apelido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 20,
  },
  modalCard: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  closeButtonText: {
    color: '#334155',
    fontWeight: '800',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitial: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: '900',
  },
  previewText: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  profileEmail: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 13,
  },
  photoButton: {
    minHeight: 44,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    marginBottom: 14,
  },
  photoButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  label: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    color: '#0f172a',
    paddingHorizontal: 12,
    fontSize: 15,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 14,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
