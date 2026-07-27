import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

export type TabKey = 'home' | 'learn' | 'progress' | 'profile';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'learn', label: 'Learn' },
  { key: 'progress', label: 'Progress' },
  { key: 'profile', label: 'Me' }
];

export function BottomNav(props: { value: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === props.value;
        return (
          <Pressable
            key={tab.key}
            style={styles.item}
            onPress={() => props.onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.coin, active && styles.coinActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
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
    borderTopColor: theme.line,
    paddingVertical: 10
  },
  item: { alignItems: 'center', gap: 5, minWidth: 56 },
  coin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.textMuted
  },
  coinActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent
  },
  label: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
  labelActive: { color: theme.accent }
});
