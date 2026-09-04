import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AppNavigator } from './src/navigation/AppNavigator';
import { queryClient } from './src/lib/queryClient';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ConfigErrorScreen } from './src/screens/ConfigErrorScreen';
import { getMissingRequiredSettings } from './src/lib/env';
import { theme } from './src/lib/theme';
function RootNavigator() {
  const auth = useAuth();

  if (auth.bootstrapping) {
    return (
      <View style={styles.bootstrappingContainer}>
        <ActivityIndicator testID="loading-indicator" color={theme.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {auth.auth ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  // Checked here rather than at module scope: a throw during module evaluation
  // happens before React mounts, so it cannot reach the error boundary and the
  // app renders as a blank screen with the reason only in the console.
  const missingSettings = getMissingRequiredSettings();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar style="light" />
          {missingSettings.length > 0 ? (
            <ConfigErrorScreen missing={missingSettings} />
          ) : (
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </QueryClientProvider>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  bootstrappingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
