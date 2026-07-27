import { StyleSheet, Text, View } from 'react-native';
import { font, palette, theme } from '../lib/theme';

// The Moneta mark — a stepped growth form inside a coin — rebuilt from plain
// views so the brand renders in-app without an SVG dependency. Mirrors
// public/marketing/moneta-mark.svg.
export function BrandMark(props: { size?: number }) {
  const size = props.size ?? 56;
  const barWidth = Math.round(size * 0.14);
  const barRadius = Math.max(2, Math.round(size * 0.045));
  const barHeights = [0.2, 0.32, 0.46].map((ratio) => Math.round(size * ratio));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Moneta"
      style={[
        styles.coin,
        { width: size, height: size, borderRadius: size / 2, paddingBottom: Math.round(size * 0.2) }
      ]}
    >
      {barHeights.map((height, index) => (
        <View
          key={index}
          style={{
            width: barWidth,
            height,
            borderRadius: barRadius,
            backgroundColor: palette.brass
          }}
        />
      ))}
    </View>
  );
}

export function BrandLockup(props: { markSize?: number; tagline?: string }) {
  return (
    <View style={styles.lockup}>
      <BrandMark size={props.markSize ?? 56} />
      <View style={styles.lockupText}>
        <Text style={styles.wordmark}>Moneta</Text>
        {props.tagline ? <Text style={styles.tagline}>{props.tagline}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: palette.signalTeal,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 241, 231, 0.2)'
  },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  lockupText: { gap: 2 },
  wordmark: {
    fontFamily: font.display,
    color: theme.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  tagline: { color: theme.textMuted, fontSize: 13 }
});
