import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Book } from '../../types'; 
import { NetflixCatalog } from './NetflixCatalogTypo'; // Mantenha o nome exato do seu arquivo de import

interface UserCatalogTabProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export const UserCatalogTab: React.FC<UserCatalogTabProps> = ({ books, onSelectBook }) => {
  
  // Geramos as seções dinamicamente baseadas em todas as categorias existentes no banco de dados
  const carrosselSections = useMemo(() => {
    const sections = [];

    // Categoria estática para livros disponíveis no topo
    sections.push({
      title: 'Disponíveis',
      match: (book: Book) => book.availableCopies > 0,
      limit: 10,
    });

    // Pega todas as categorias únicas dos livros
    const categories = [...new Set(books.map((b) => b.category).filter(Boolean))];
    
    categories.forEach((cat) => {
      sections.push({
        title: cat,
        match: (book: Book) => book.category === cat,
      });
    });

    return sections;
  }, [books]);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <NetflixCatalog
          books={books} // Passa a lista base; o NetflixCatalog vai cuidar do filtro interno textualmente
          sections={carrosselSections}
          onSelectBook={onSelectBook}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});