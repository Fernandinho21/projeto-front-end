import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { searchExternalBook } from '../../services/bookService';
import { Book } from '../../types';

export const AddBookScreen = ({ onClose, onAddBook }: any) => {
  const [isbn, setIsbn] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [loading, setLoading] = useState(false);
  const [bookFound, setBookFound] = useState<Book | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualBook, setManualBook] = useState({
    title: '', author: '', publisher: '', year: '', category: '', location: ''
  });

  const searchBook = async () => {
    if (!isbn.trim()) {
      Alert.alert('Erro', 'Digite um ISBN');
      return;
    }
    setLoading(true);
    setBookFound(null);
    const result = await searchExternalBook(isbn);
    if (result) {
      setBookFound(result);
      Alert.alert('Sucesso', `Livro encontrado: ${result.title}`);
    } else {
      Alert.alert('Livro não encontrado', 'Deseja cadastrar manualmente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cadastrar', onPress: () => setManualMode(true) }
      ]);
    }
    setLoading(false);
  };

  const handleAddBook = () => {
    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd < 1) {
      Alert.alert('Erro', 'Quantidade inválida');
      return;
    }
    let newBook: Book;
    if (bookFound) {
      newBook = { ...bookFound };
    } else {
      if (!manualBook.title || !manualBook.author) {
        Alert.alert('Erro', 'Preencha título e autor');
        return;
      }
      newBook = {
        id: Date.now().toString(),
        title: manualBook.title,
        author: manualBook.author,
        publisher: manualBook.publisher || 'Não informada',
        year: parseInt(manualBook.year) || new Date().getFullYear(),
        isbn: isbn || `MANUAL-${Date.now()}`,
        totalCopies: qtd,
        availableCopies: qtd,
        location: manualBook.location || 'Geral',
        category: manualBook.category || 'Geral'
      };
    }
    onAddBook(newBook);
    Alert.alert('Sucesso', `${newBook.title} adicionado!`);
    onClose();
  };

  if (manualMode) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Cadastro Manual</Text>
        <TextInput style={styles.input} placeholder="Título *" value={manualBook.title} onChangeText={t => setManualBook({...manualBook, title: t})} />
        <TextInput style={styles.input} placeholder="Autor *" value={manualBook.author} onChangeText={t => setManualBook({...manualBook, author: t})} />
        <TextInput style={styles.input} placeholder="Editora" value={manualBook.publisher} onChangeText={t => setManualBook({...manualBook, publisher: t})} />
        <TextInput style={styles.input} placeholder="Ano" value={manualBook.year} onChangeText={t => setManualBook({...manualBook, year: t})} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Categoria" value={manualBook.category} onChangeText={t => setManualBook({...manualBook, category: t})} />
        <TextInput style={styles.input} placeholder="Localização" value={manualBook.location} onChangeText={t => setManualBook({...manualBook, location: t})} />
        <TextInput style={styles.input} placeholder="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={handleAddBook}><Text style={styles.buttonText}>Cadastrar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setManualMode(false)}><Text style={styles.buttonText}>Voltar</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Adicionar Livro</Text>
      <Text style={styles.label}>ISBN:</Text>
      <TextInput style={styles.input} placeholder="Digite o ISBN" value={isbn} onChangeText={setIsbn} keyboardType="numeric" />
      <TouchableOpacity style={styles.button} onPress={searchBook} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Buscar</Text>}
      </TouchableOpacity>
      {bookFound && (
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{bookFound.title}</Text>
          <Text>{bookFound.author}</Text>
          <Text style={styles.label}>Quantidade:</Text>
          <TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
          <TouchableOpacity style={styles.button} onPress={handleAddBook}><Text style={styles.buttonText}>Adicionar</Text></TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}><Text style={styles.buttonText}>Voltar</Text></TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2c3e50' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 15, marginBottom: 5, color: '#34495e' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  cancelButton: { backgroundColor: '#95a5a6' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bookInfo: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginTop: 20, borderWidth: 1, borderColor: '#DDD' },
  bookTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
});