import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { initialBooks } from "./src/data/mockBooks";
import type { ActiveLoan, Book } from "./src/types";

const palette = {
  bg: "#f5f0e8",
  card: "#ffffff",
  text: "#1c1917",
  muted: "#78716c",
  line: "#e7e5e4",
  primary: "#3f4f46",
  accent: "#b45309",
  accentSoft: "#fff7ed",
  available: "#166534",
  unavailable: "#9a3412",
};

function addDaysISO(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function AppContent() {
  const [tab, setTab] = useState<"catalog" | "loans">("catalog");
  const [books, setBooks] = useState<Book[]>(() => [...initialBooks]);
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Book | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
    );
  }, [books, query]);

  function borrow(book: Book) {
    if (!book.available) return;
    const today = new Date();
    const withdrawal = today.toISOString().slice(0, 10);
    const due = addDaysISO(today, 14);
    setLoans((prev) => [
      {
        id: `${book.id}-${Date.now()}`,
        bookId: book.id,
        title: book.title,
        author: book.author,
        withdrawalDate: withdrawal,
        returnDate: due,
      },
      ...prev,
    ]);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, available: false } : b))
    );
    setSelected(null);
  }

  function returnLoan(loanId: string, bookId: string) {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, available: true } : b))
    );
  }

  function formatBR(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>Biblioteca</Text>
        <Text style={styles.sub}>Empréstimo de livros</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab("catalog")}
          style={[styles.tab, tab === "catalog" && styles.tabActive]}
        >
          <Ionicons
            name="library-outline"
            size={20}
            color={tab === "catalog" ? palette.accent : palette.muted}
          />
          <Text
            style={[styles.tabLabel, tab === "catalog" && styles.tabLabelActive]}
          >
            Catálogo
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("loans")}
          style={[styles.tab, tab === "loans" && styles.tabActive]}
        >
          <Ionicons
            name="bookmarks-outline"
            size={20}
            color={tab === "loans" ? palette.accent : palette.muted}
          />
          <Text style={[styles.tabLabel, tab === "loans" && styles.tabLabelActive]}>
            Meus empréstimos
          </Text>
          {loans.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{loans.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {tab === "catalog" ? (
        <View style={styles.panel}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={palette.muted} />
            <TextInput
              placeholder="Buscar por título, autor ou ISBN"
              placeholderTextColor={palette.muted}
              value={query}
              onChangeText={setQuery}
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPad}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum livro encontrado.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => setSelected(item)}
                android_ripple={{ color: "#00000012" }}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      styles.pill,
                      item.available ? styles.pillOk : styles.pillNo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        item.available ? styles.pillTextOk : styles.pillTextNo,
                      ]}
                    >
                      {item.available ? "Disponível" : "Indisponível"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.meta}>ISBN {item.isbn}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <View style={styles.panel}>
          <FlatList
            data={loans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPad}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="book-outline" size={40} color={palette.muted} />
                <Text style={styles.emptyTitle}>Nenhum empréstimo ativo</Text>
                <Text style={styles.emptySub}>
                  No catálogo, escolha um livro disponível e toque em “Pegar
                  emprestado”.
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <View style={styles.loanCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.author}>{item.author}</Text>
                  <Text style={styles.dates}>
                    Retirada: {formatBR(item.withdrawalDate)} · Devolução:{" "}
                    {formatBR(item.returnDate)}
                  </Text>
                </View>
                <Pressable
                  style={styles.returnBtn}
                  onPress={() => returnLoan(item.id, item.bookId)}
                >
                  <Text style={styles.returnBtnText}>Devolver</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <View style={styles.sheet}>
            {selected ? (
              <>
                <Text style={styles.sheetTitle}>{selected.title}</Text>
                <Text style={styles.sheetAuthor}>{selected.author}</Text>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>ISBN</Text>
                  <Text style={styles.sheetValue}>{selected.isbn}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Edição</Text>
                  <Text style={styles.sheetValue}>{selected.edition}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetLabel}>Páginas</Text>
                  <Text style={styles.sheetValue}>{String(selected.pages)}</Text>
                </View>
                <View
                  style={[
                    styles.pill,
                    selected.available ? styles.pillOk : styles.pillNo,
                    { alignSelf: "flex-start", marginTop: 12 },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selected.available ? styles.pillTextOk : styles.pillTextNo,
                    ]}
                  >
                    {selected.available ? "Disponível para empréstimo" : "Sem exemplar livre"}
                  </Text>
                </View>
                <View style={styles.sheetActions}>
                  <Pressable
                    style={styles.ghostBtn}
                    onPress={() => setSelected(null)}
                  >
                    <Text style={styles.ghostBtnText}>Fechar</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.primaryBtn,
                      !selected.available && styles.primaryBtnDisabled,
                    ]}
                    disabled={!selected.available}
                    onPress={() => borrow(selected)}
                  >
                    <Text style={styles.primaryBtnText}>Pegar emprestado</Text>
                  </Pressable>
                </View>
                <Text style={styles.hint}>
                  Prazo sugerido: 14 dias (simulação local; depois ligue à API).
                </Text>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    color: palette.text,
    letterSpacing: -0.5,
  },
  sub: { marginTop: 4, color: palette.muted, fontSize: 15 },
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  tabActive: {
    borderColor: palette.accent,
    backgroundColor: palette.accentSoft,
  },
  tabLabel: { fontSize: 14, fontWeight: "600", color: palette.muted },
  tabLabelActive: { color: palette.accent },
  badge: {
    marginLeft: 4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  panel: { flex: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  search: { flex: 1, fontSize: 16, color: palette.text, paddingVertical: 0 },
  listPad: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: palette.text,
  },
  author: { marginTop: 6, fontSize: 15, color: palette.muted },
  meta: { marginTop: 4, fontSize: 13, color: palette.muted },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillOk: { backgroundColor: "#dcfce7" },
  pillNo: { backgroundColor: "#ffedd5" },
  pillText: { fontSize: 12, fontWeight: "600" },
  pillTextOk: { color: palette.available },
  pillTextNo: { color: palette.unavailable },
  empty: { textAlign: "center", color: palette.muted, marginTop: 32 },
  emptyBox: { alignItems: "center", paddingTop: 48, paddingHorizontal: 24 },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
  },
  emptySub: {
    marginTop: 8,
    textAlign: "center",
    color: palette.muted,
    lineHeight: 22,
  },
  loanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  dates: { marginTop: 8, fontSize: 13, color: palette.muted },
  returnBtn: {
    backgroundColor: palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  returnBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    paddingBottom: 28,
  },
  sheetTitle: { fontSize: 22, fontWeight: "800", color: palette.text },
  sheetAuthor: { marginTop: 6, fontSize: 16, color: palette.muted },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: palette.line,
    paddingBottom: 8,
  },
  sheetLabel: { color: palette.muted, fontSize: 14 },
  sheetValue: { color: palette.text, fontSize: 14, fontWeight: "600" },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  ghostBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  ghostBtnText: { fontWeight: "700", color: palette.text },
  primaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: palette.accent,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontWeight: "800", color: "#fff", fontSize: 15 },
  hint: { marginTop: 12, fontSize: 12, color: palette.muted, lineHeight: 18 },
});
