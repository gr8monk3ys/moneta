import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

export type TabKey = 'home' | 'learn' | 'progress' | 'profile';

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'learn', label: 'Learn', icon: '📚' },
  { key: 'progress', label: 'Progress', icon: '📈' },
  { key: 'profile', label: 'Me', icon: '👤' }
];

export function BottomNav(props: { value: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === props.value;
        return (
          <Pressable key={tab.key} style={styles.item} onPress={() => props.onChange(tab.key)}>
            <Text style={[styles.icon, active && styles.active]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: '#2f3440',
    paddingVertical: 10
  },
  item: { alignItems: 'center', gap: 3 },
  icon: { color: theme.textMuted, fontSize: 16 },
  label: { color: theme.textMuted, fontSize: 12 },
  active: { color: theme.accent }
});
