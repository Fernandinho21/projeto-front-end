import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../../types'; // adjust path as needed

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── tunables ────────────────────────────────────────────────────────────────
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

// ── InfiniteRow ───────────────────────────────────────────────────────────────
// A horizontally scrollable, looping row of book cards.
const InfiniteRow: React.FC<{ books: Book[]; onSelect: (b: Book) => void }> = ({
  books,
  onSelect,
}) => {
  if (books.length === 0) return null;

  // For short lists just repeat them so there's always enough to scroll
  const fill = books.length < 5 ? [...books, ...books, ...books] : books;

  // Infinite loop: prepend & append clones
  const CLONES = 3;
  const looped = [...fill.slice(-CLONES), ...fill, ...fill.slice(0, CLONES)];
  const ITEM_W = CARD_WIDTH + CARD_MARGIN * 2;

  const scrollRef = useRef<ScrollView>(null);
  const position = useRef(CLONES); // index in looped array

  const scrollTo = (idx: number, animated = true) => {
    scrollRef.current?.scrollTo({ x: idx * ITEM_W, animated });
  };

  useEffect(() => {
    scrollTo(CLONES, false);
  }, []);

  const handleScrollEnd = (e: any) => {
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
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={ITEM_W}
      snapToAlignment="start"
      onMomentumScrollEnd={handleScrollEnd}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingHorizontal: 8 }}
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
  );
};

const card = StyleSheet.create({
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
});

// ── NetflixCatalog (main export) ──────────────────────────────────────────────
export const NetflixCatalog: React.FC<Props> = ({ books, sections, onSelectBook }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

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
      <View style={nc.controls}>
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
          {(['all', 'available', 'unavailable'] as const).map(f => (
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
      </View>

      {/* ── Results / rows ── */}
      <ScrollView style={nc.scroll} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={nc.section}>
            <Text style={nc.sectionTitle}>
              Resultados ({filtered.length})
            </Text>
            <InfiniteRow books={filtered} onSelect={onSelectBook} />
          </View>
        ) : (
          sections.map(section => {
            const sectionBooks = books
              .filter(section.match)
              .slice(0, section.limit ?? undefined);
            if (sectionBooks.length === 0) return null;
            return (
              <View key={section.title} style={nc.section}>
                <Text style={nc.sectionTitle}>{section.title}</Text>
                <InfiniteRow books={sectionBooks} onSelect={onSelectBook} />
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const nc = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
    marginBottom: 8,
  },
  input: { flex: 1, color: '#000', fontSize: 14 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
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
