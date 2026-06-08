import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../../types'; 
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONTROLS_HEIGHT = 96;

// ─── Cards_Livros ────────────────────────────────────────────────────────────────
const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_MARGIN = 8;
// ─────────────────────────────────────────────────────────────────────────────

interface CatalogSection {
  title: string;
  match: (book: Book) => boolean;
  limit?: number;
}

interface Props {
  books: Book[];
  sections: CatalogSection[];
  onSelectBook: (book: Book) => void;
}

// ── Carrossel ───────────────────────────────────────────────────────────────
const InfiniteRow: React.FC<{ books: Book[]; onSelect: (b: Book) => void }> = ({
  books,
  onSelect,
}) => {
  if (books.length === 0) return null;

  const scrollRef = useRef<ScrollView>(null);
  const ITEM_W = CARD_WIDTH + CARD_MARGIN * 2;

  // REGRA: Loop infinito apenas quando a categoria possui 3 ou mais itens
  const isInfinite = books.length >= 3;

  // Ajusta a lista base para listas muito pequenas que ativam o loop
  const fill = !isInfinite ? books : (books.length < 5 ? [...books, ...books, ...books] : books);

  // Injeta clones apenas se for rodar de forma infinita
  const CLONES = 3;
  const looped = isInfinite 
    ? [...fill.slice(-CLONES), ...fill, ...fill.slice(0, CLONES)]
    : books;

  const position = useRef(isInfinite ? CLONES : 0);

  const scrollTo = (idx: number, animated = true) => {
    if (!isInfinite) return;
    scrollRef.current?.scrollTo({ x: idx * ITEM_W, animated });
  };

  useEffect(() => {
    if (isInfinite) {
      scrollTo(CLONES, false);
    }
  }, [books, isInfinite]);

  const handleScrollEnd = (e: any) => {
    if (!isInfinite) return;

    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / ITEM_W);
    position.current = idx;

    const real = fill.length;
    if (idx < CLONES) {
      const target = idx + real;
      position.current = target;
      scrollTo(target, false);
    } else if (idx >= CLONES + real) {
      const target = idx - real;
      position.current = target;
      scrollTo(target, false);
    }
  };
  return (
    <View style={card.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={isInfinite ? "fast" : "normal"}
        snapToInterval={isInfinite ? ITEM_W : undefined}
        snapToAlignment={isInfinite ? "start" : undefined}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        bounces={!isInfinite}
      >
        {looped.map((book, i) => (
          <TouchableOpacity
            key={`row-${i}`}
            style={card.wrapper}
            onPress={() => onSelect(book)}
            activeOpacity={0.8}
          >
            {book.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={card.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={[card.cover, card.placeholder]}>
                <Ionicons name="book" size={32} color="#555" />
              </View>
            )}
            
            {/* availability pill */}
            <View
              style={[
                card.pill,
                { backgroundColor: book.availableCopies > 0 ? '#16a34a' : '#9f1239' },
              ]}
            >
              <Text style={card.pillText}>
                {book.availableCopies > 0 ? book.availableCopies : '✕'}
              </Text>
            </View>

            <View style={card.meta}>
              <Text style={card.title} numberOfLines={2}>
                {book.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {books.length > 2 && (
        <View style={card.rightOverlay} pointerEvents="none">
          <View style={card.fadeOverlay} />
          <View style={card.arrowIndicator}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
};

const card = StyleSheet.create({
  container: {
    position: 'relative',
  },
  wrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  pill: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 22,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  pillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  meta: { marginTop: 6, paddingHorizontal: 2 },
  title: { fontSize: 12, color: '#000', fontWeight: '600', lineHeight: 15 },
  rightOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 35.5,
    width: 25, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(41, 41, 41, 0.64)', 
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10
  },
  arrowIndicator: {
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)', 
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
});

// ── Catalog ─────────────────────────────────────────────────────────────────────────────────────
export const NetflixCatalog: React.FC<Props> = ({ books, sections, onSelectBook }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Guardamos as referências do scroll anterior para calcular a direção do movimento
  const scrollOffset = useRef(0);
  const headerClampedScroll = useRef(new Animated.Value(0)).current;

  // Criamos o mapeamento direto baseado na trava (clamped) do movimento incremental
  const translateY = headerClampedScroll.interpolate({
    inputRange: [0, CONTROLS_HEIGHT],
    outputRange: [0, -CONTROLS_HEIGHT],
    extrapolate: 'clamp',
  });

  const opacity = headerClampedScroll.interpolate({
    inputRange: [0, CONTROLS_HEIGHT / 2, CONTROLS_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Função responsável por monitorar a direção da rolagem
  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // Calcula a variação de pixels rodados desde o último frame
    const diff = currentOffset - scrollOffset.current;
    scrollOffset.current = currentOffset;

    // Evita comportamentos estranhos ao puxar demais no topo (efeito elástico do iOS)
    if (currentOffset <= 0) {
      headerClampedScroll.setValue(0);
      return;
    }

    // @ts-ignore
    let newValue = headerClampedScroll._value + diff;

    if (newValue < 0) {
      newValue = 0;
    } else if (newValue > CONTROLS_HEIGHT) {
      newValue = CONTROLS_HEIGHT;
    }

    headerClampedScroll.setValue(newValue);
  };
  const filtered = books.filter(b => {
    const q = query.toLowerCase();
    const matchQ =
      !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchF =
      filter === 'all' ||
      (filter === 'available' && b.availableCopies > 0) ||
      (filter === 'unavailable' && b.availableCopies === 0);
    return matchQ && matchF;
  });

  const isSearching = !!query || filter !== 'all';

  return (
    <View style={nc.root}>
      {/* ── Search + filter ── */}
      <Animated.View style={[nc.controls, { transform: [{ translateY }], opacity }]}>
        <View style={nc.searchBar}>
          <Ionicons name="search" size={16} color="#aaa" />
          <TextInput
            style={nc.input}
            placeholder="Título ou autor…"
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <View style={nc.pills}>
          {((['all', 'available', 'unavailable'] as const)).map(f => (
            <TouchableOpacity
              key={f}
              style={[nc.pill, filter === f && nc.pillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[nc.pillText, filter === f && nc.pillTextActive]}>
                {f === 'all' ? 'Todos' : f === 'available' ? 'Disponíveis' : 'Indisponíveis'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Results / rows ── */}
      <ScrollView 
        style={nc.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16} 
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: CONTROLS_HEIGHT + 12 }}
      >
        {isSearching ? (
          <View style={nc.section}>
            <Text style={nc.sectionTitle}>Resultados ({filtered.length})</Text>
            <InfiniteRow books={filtered} onSelect={onSelectBook} />
          </View>
        ) : (
          sections.map(section => {
            const sectionBooks = books.filter(section.match).slice(0, section.limit ?? undefined);
            if (sectionBooks.length === 0) return null;
            return (
              <View key={section.title} style={nc.section}>
                <Text style={nc.sectionTitle}>{section.title}</Text>
                <InfiniteRow books={sectionBooks} onSelect={onSelectBook} />
              </View>
            );
          })
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const nc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  controls: {
    backgroundColor: '#ffffffec',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CONTROLS_HEIGHT,
    zIndex: 99,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 12,
    marginBottom: 8,
  },
  input: { flex: 1, color: '#000', fontSize: 14 },
  pills: { flexDirection: 'row', gap: 12 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  pillActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  pillText: { color: '#000', fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  section: { marginBottom: 24, paddingTop: 4 },
  sectionTitle: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    paddingHorizontal: 16,
    letterSpacing: 0.3,
  },
  
});