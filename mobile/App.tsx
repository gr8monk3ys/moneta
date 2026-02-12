import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { BottomNav, type TabKey } from './src/components/BottomNav';
import { useAuthState } from './src/hooks/useAuth';
import { type AuthContext } from './src/lib/api';
import { theme } from './src/lib/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';

interface MainTabsProps {
  userId: string;
  authContext: AuthContext;
  onLogout: () => void;
}

function MainTabs(props: MainTabsProps) {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        {tab === 'home' && <HomeScreen userId={props.userId} auth={props.authContext} />}
        {tab === 'learn' && <LearnScreen userId={props.userId} auth={props.authContext} />}
        {tab === 'progress' && <ProgressScreen userId={props.userId} auth={props.authContext} />}
        {tab === 'profile' && <ProfileScreen userId={props.userId} auth={props.authContext} onLogout={props.onLogout} />}
      </View>
      <BottomNav value={tab} onChange={setTab} />
    </View>
  );
}

export default function App() {
  const auth = useAuthState();

  if (auth.bootstrapping) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.bootstrappingContainer}>
          <ActivityIndicator testID="loading-indicator" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!auth.auth) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <LoginScreen onAuthenticated={auth.login} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <MainTabs
        userId={auth.auth.userId}
        authContext={{
          accessToken: auth.auth.accessToken,
          refreshToken: auth.auth.refreshToken,
          onTokensUpdated: auth.updateTokens
        }}
        onLogout={auth.logout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  page: { flex: 1 },
  content: { flex: 1 },
  bootstrappingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
