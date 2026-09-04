import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLockup } from '../components/BrandMark';
import type { MissingSetting } from '../lib/env';
import { font, radius, surface, theme, type } from '../lib/theme';

function Notice(props: { testID: string; eyebrow: string; title: string; blurb: string; children?: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.container} testID={props.testID}>
      <BrandLockup tagline="Finance learning for real life" />
      <Text style={styles.eyebrow}>{props.eyebrow}</Text>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.blurb}>{props.blurb}</Text>
      {props.children}
    </ScrollView>
  );
}

/**
 * Shown instead of the app when a required build setting is absent. A missing
 * environment variable used to throw while modules were still evaluating,
 * which meant React never mounted and the whole app was a white rectangle with
 * the reason buried in the browser console. Say what is missing, and what to
 * put in it.
 */
export function ConfigErrorScreen(props: { missing: MissingSetting[] }) {
  return (
    <Notice
      testID="config-error-screen"
      eyebrow="Setup needed"
      title="Moneta isn't pointed at a backend yet"
      blurb="This build finished without the settings the app needs to reach its API, so there is nothing to sign in to. Set the values below, rebuild, and this screen goes away."
    >
      {props.missing.map((setting) => (
        <View key={setting.name} style={styles.card}>
          <Text style={styles.varName}>{setting.name}</Text>
          <Text style={styles.purpose}>{setting.purpose}</Text>
          <Text style={styles.exampleLabel}>Set it to something like</Text>
          <Text style={styles.example}>{`${setting.name}=${setting.example}`}</Text>
        </View>
      ))}

      <Text style={styles.footnote}>
        Put these in mobile/.env (copy mobile/.env.example) or pass them on the build command. Expo bundles only
        variables whose names start with EXPO_PUBLIC_, and only the values present at the moment the bundle was built.
      </Text>
    </Notice>
  );
}

/**
 * Last-resort fallback for the root error boundary: an unexpected crash should
 * still read as a sentence, not as a blank screen.
 */
export function FatalErrorScreen(props: { error: Error }) {
  return (
    <Notice
      testID="fatal-error-screen"
      eyebrow="Something broke"
      title="Moneta stopped before it could load"
      blurb="This isn't your fault and nothing you saved is lost. Reopen the app to try again — if it keeps happening, the message below is what to report."
    >
      <View style={styles.card}>
        <Text style={styles.varName}>Error</Text>
        <Text style={styles.example}>{props.error.message || 'No message was attached to the error.'}</Text>
      </View>
    </Notice>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.bg, padding: 24, justifyContent: 'center', gap: 12 },
  eyebrow: { ...type.eyebrow, marginTop: 20 },
  title: { ...type.display, marginTop: 2 },
  blurb: { ...type.body, marginBottom: 4 },
  card: { ...surface.card, padding: 16, gap: 6 },
  varName: { fontFamily: font.ui, color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  purpose: { ...type.body },
  exampleLabel: { ...type.caption, marginTop: 4 },
  example: {
    color: theme.accentBright,
    backgroundColor: theme.accentSoft,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 13,
    lineHeight: 18
  },
  footnote: { ...type.caption, marginTop: 4 }
});
