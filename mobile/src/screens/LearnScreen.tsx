import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchToday, type AuthContext } from '../lib/api';
import { theme } from '../lib/theme';

interface LearnScreenProps {
  userId: string;
  auth: AuthContext;
}

const path = ['Money Basics', 'Credit & Debt', 'Saving Safety', 'Investing Basics', 'Retirement', 'Taxes'];

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function LearnScreen(props: LearnScreenProps) {
  const [nextLesson, setNextLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchToday(props.userId, props.auth)
      .then((today) => {
        setNextLesson(today.nextLesson?.title ?? null);
      })
      .catch((reason) => {
        setError(formatError(reason));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [props.auth, props.userId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learning Path</Text>
      {loading ? <ActivityIndicator color={theme.accent} /> : null}
      {nextLesson ? <Text style={styles.subtitle}>Up next: {nextLesson}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {path.map((item, index) => (
        <View key={item} style={[styles.node, index === 0 && styles.activeNode]}>
          <Text style={[styles.nodeText, index === 0 && styles.activeNodeText]}>{index + 1}. {item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 10 },
  title: { color: theme.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: theme.textMuted },
  error: { color: theme.danger },
  node: { backgroundColor: theme.card, borderRadius: 14, padding: 14 },
  activeNode: { borderColor: theme.accent, borderWidth: 1, backgroundColor: '#2d2620' },
  nodeText: { color: theme.textPrimary, fontWeight: '600' },
  activeNodeText: { color: theme.accent }
});
