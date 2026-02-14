import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { BottomNav, type TabKey } from './src/components/BottomNav';
import { useAuthState } from './src/hooks/useAuth';
import { type AuthContext } from './src/lib/api';
import { theme } from './src/lib/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { LessonPlayerScreen } from './src/screens/LessonPlayerScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { ReviewPlayerScreen } from './src/screens/ReviewPlayerScreen';

interface MainTabsProps {
  userId: string;
  authContext: AuthContext;
  onLogout: () => void;
}

function MainTabs(props: MainTabsProps) {
  const [tab, setTab] = useState<TabKey>('home');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonReturnTab, setLessonReturnTab] = useState<TabKey | null>(null);
  const [activeReview, setActiveReview] = useState(false);
  const [reviewReturnTab, setReviewReturnTab] = useState<TabKey | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  function openLesson(lessonId: string) {
    setLessonReturnTab(tab);
    setActiveLessonId(lessonId);
  }

  function openReviews() {
    setReviewReturnTab(tab);
    setActiveReview(true);
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        {activeLessonId ? (
          <LessonPlayerScreen
            userId={props.userId}
            lessonId={activeLessonId}
            auth={props.authContext}
            onExit={(updated) => {
              setActiveLessonId(null);
              setTab(lessonReturnTab ?? tab);
              setLessonReturnTab(null);
              if (updated) {
                setRefreshNonce((prev) => prev + 1);
              }
            }}
          />
        ) : null}

        {activeReview ? (
          <ReviewPlayerScreen
            userId={props.userId}
            auth={props.authContext}
            onExit={(updated) => {
              setActiveReview(false);
              setTab(reviewReturnTab ?? tab);
              setReviewReturnTab(null);
              if (updated) {
                setRefreshNonce((prev) => prev + 1);
              }
            }}
          />
        ) : null}

        {!activeLessonId && !activeReview ? (
          <>
            {tab === 'home' && (
              <HomeScreen
                userId={props.userId}
                auth={props.authContext}
                refreshNonce={refreshNonce}
                onOpenLesson={openLesson}
                onStartReviews={openReviews}
              />
            )}
            {tab === 'learn' && (
              <LearnScreen
                userId={props.userId}
                auth={props.authContext}
                refreshNonce={refreshNonce}
                onOpenLesson={openLesson}
              />
            )}
            {tab === 'progress' && <ProgressScreen userId={props.userId} auth={props.authContext} />}
            {tab === 'profile' && <ProfileScreen userId={props.userId} auth={props.authContext} onLogout={props.onLogout} />}
          </>
        ) : null}
      </View>
      {!activeLessonId && !activeReview ? <BottomNav value={tab} onChange={setTab} /> : null}
    </View>
  );
}

export default function App() {
  const auth = useAuthState();

  if (auth.bootstrapping) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar style="light" />
          <View style={styles.bootstrappingContainer}>
            <ActivityIndicator testID="loading-indicator" color={theme.accent} />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!auth.auth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar style="light" />
          <LoginScreen onAuthenticated={auth.login} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  page: { flex: 1 },
  content: { flex: 1 },
  bootstrappingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
