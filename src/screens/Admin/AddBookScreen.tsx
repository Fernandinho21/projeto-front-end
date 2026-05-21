import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { searchExternalBook } from '../../services/bookService';
import { Book } from '../../types';

type Props = {
  onClose: () => void;
  onAddBook: (book: Book) => void;
};

export const AddBookScreen: React.FC<Props> = ({ onClose, onAddBook }) => {
  const [isbn, setIsbn] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [bookFound, setBookFound] = useState<Book | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [manualBook, setManualBook] = useState({
    title: '',
    author: '',
    publisher: '',
    year: '',
    category: '',
    location: '',
  });

  const selectedCover = coverUri ?? bookFound?.coverUrl;

  const searchBook = async () => {
    if (!isbn.trim()) {
      Alert.alert('Erro', 'Digite um ISBN.');
      return;
    }

    setLoading(true);
    setBookFound(null);
    setCoverUri(undefined);

    const result = await searchExternalBook(isbn);

    if (result) {
      setBookFound(result);
      setManualMode(false);
      Alert.alert('Livro encontrado', `${result.title} foi carregado pelo ISBN.`);
    } else {
      Alert.alert('Livro nao encontrado', 'Voce pode cadastrar manualmente.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cadastrar', onPress: () => setManualMode(true) },
      ]);
    }

    setLoading(false);
  };

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissao necessaria', 'Libere a galeria para escolher uma capa.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const buildManualBook = (copies: number): Book | null => {
    if (!manualBook.title.trim() || !manualBook.author.trim()) {
      Alert.alert('Erro', 'Preencha titulo e autor.');
      return null;
    }

    return {
      id: `manual-${Date.now()}`,
      title: manualBook.title.trim(),
      author: manualBook.author.trim(),
      publisher: manualBook.publisher.trim() || 'Editora nao informada',
      year: Number.parseInt(manualBook.year, 10) || new Date().getFullYear(),
      isbn: isbn.trim() || `MANUAL-${Date.now()}`,
      totalCopies: copies,
      availableCopies: copies,
      location: manualBook.location.trim() || 'Geral',
      category: manualBook.category.trim() || 'Geral',
      coverUrl: selectedCover,
    };
  };

  const handleAddBook = () => {
    const copies = Number.parseInt(quantity, 10);

    if (Number.isNaN(copies) || copies < 1) {
      Alert.alert('Erro', 'Quantidade invalida.');
      return;
    }

    const newBook = bookFound
      ? {
          ...bookFound,
          totalCopies: copies,
          availableCopies: copies,
          coverUrl: selectedCover,
        }
      : buildManualBook(copies);

    if (!newBook) return;

    onAddBook(newBook);
    Alert.alert('Sucesso', `${newBook.title} foi adicionado ao acervo.`);
    onClose();
  };

  const renderCoverPreview = () => (
    <View style={styles.coverArea}>
      {selectedCover ? (
        <Image source={{ uri: selectedCover }} style={styles.coverPreview} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverPlaceholderText}>Capa</Text>
        </View>
      )}
      <TouchableOpacity style={styles.secondaryButton} onPress={pickCover}>
        <Text style={styles.secondaryButtonText}>Escolher PNG/JPG</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Acervo</Text>
          <Text style={styles.title}>Adicionar livro</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.label}>ISBN</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 9788535914841"
          placeholderTextColor="#94a3b8"
          value={isbn}
          onChangeText={setIsbn}
          keyboardType="default"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={searchBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Buscar por ISBN</Text>
          )}
        </TouchableOpacity>
      </View>

      {bookFound && (
        <View style={styles.bookInfo}>
          {renderCoverPreview()}
          <View style={styles.bookText}>
            <Text style={styles.bookTitle}>{bookFound.title}</Text>
            <Text style={styles.bookMeta}>{bookFound.author}</Text>
            <Text style={styles.bookMeta}>{bookFound.publisher}</Text>
            <Text style={styles.bookMeta}>Categoria: {bookFound.category}</Text>
          </View>
        </View>
      )}

      {!bookFound && (
        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setManualMode((current) => !current)}
        >
          <Text style={styles.manualToggleText}>
            {manualMode ? 'Ocultar cadastro manual' : 'Cadastrar manualmente'}
          </Text>
        </TouchableOpacity>
      )}

      {manualMode && !bookFound && (
        <View style={styles.manualBox}>
          {renderCoverPreview()}
          <Text style={styles.label}>Titulo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Titulo do livro"
            placeholderTextColor="#94a3b8"
            value={manualBook.title}
            onChangeText={(text) => setManualBook({ ...manualBook, title: text })}
          />
          <Text style={styles.label}>Autor *</Text>
          <TextInput
            style={styles.input}
            placeholder="Autor"
            placeholderTextColor="#94a3b8"
            value={manualBook.author}
            onChangeText={(text) => setManualBook({ ...manualBook, author: text })}
          />
          <Text style={styles.label}>Editora</Text>
          <TextInput
            style={styles.input}
            placeholder="Editora"
            placeholderTextColor="#94a3b8"
            value={manualBook.publisher}
            onChangeText={(text) =>
              setManualBook({ ...manualBook, publisher: text })
            }
          />
          <Text style={styles.label}>Ano</Text>
          <TextInput
            style={styles.input}
            placeholder="2026"
            placeholderTextColor="#94a3b8"
            value={manualBook.year}
            onChangeText={(text) => setManualBook({ ...manualBook, year: text })}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            placeholder="Romance, Tecnologia, Historia..."
            placeholderTextColor="#94a3b8"
            value={manualBook.category}
            onChangeText={(text) =>
              setManualBook({ ...manualBook, category: text })
            }
          />
          <Text style={styles.label}>Localizacao</Text>
          <TextInput
            style={styles.input}
            placeholder="A1-03"
            placeholderTextColor="#94a3b8"
            value={manualBook.location}
            onChangeText={(text) =>
              setManualBook({ ...manualBook, location: text })
            }
          />
        </View>
      )}

      {(bookFound || manualMode) && (
        <View style={styles.footerBox}>
          <Text style={styles.label}>Quantidade de copias</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={handleAddBook}>
            <Text style={styles.buttonText}>Adicionar ao acervo</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  closeButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#334155',
    fontWeight: '800',
  },
  searchBox: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
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
    backgroundColor: '#ffffff',
    color: '#0f172a',
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  bookInfo: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  coverArea: {
    width: 124,
    marginRight: 14,
  },
  coverPreview: {
    width: 124,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  coverPlaceholder: {
    width: 124,
    height: 180,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  coverPlaceholderText: {
    color: '#64748b',
    fontWeight: '900',
  },
  bookText: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  bookMeta: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 4,
  },
  manualToggle: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#facc15',
    marginBottom: 12,
  },
  manualToggleText: {
    color: '#0f172a',
    fontWeight: '900',
  },
  manualBox: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  footerBox: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
