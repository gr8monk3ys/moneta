import type { BottomTabBarProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { BottomNav, type TabKey } from '../components/BottomNav';
import { queryKeys } from '../lib/queryKeys';
import { type AuthContext } from '../lib/api';
import { useAuth } from '../providers/AuthProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { LessonPlayerScreen } from '../screens/LessonPlayerScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ReviewPlayerScreen } from '../screens/ReviewPlayerScreen';
import type { AppStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
type RootNavigation = NativeStackNavigationProp<AppStackParamList>;

function toAuthContext(auth: NonNullable<ReturnType<typeof useAuth>['auth']>, updateTokens: ReturnType<typeof useAuth>['updateTokens']): AuthContext {
  return {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    onTokensUpdated: updateTokens
  };
}

function TabBar(props: BottomTabBarProps) {
  const active = props.state.routeNames[props.state.index] as TabKey;
  return (
    <BottomNav
      value={active}
      onChange={(tab) => {
        props.navigation.navigate(tab);
      }}
    />
  );
}

function HomeRoute() {
  const auth = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  if (!auth.auth) {
    return null;
  }

  const parent = navigation.getParent() as RootNavigation | undefined;
  return (
    <HomeScreen
      userId={auth.auth.userId}
      auth={toAuthContext(auth.auth, auth.updateTokens)}
      onOpenLesson={(lessonId) => parent?.navigate('LessonPlayer', { lessonId })}
      onStartReviews={() => parent?.navigate('ReviewPlayer')}
    />
  );
}

function LearnRoute() {
  const auth = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  if (!auth.auth) {
    return null;
  }

  const parent = navigation.getParent() as RootNavigation | undefined;
  return (
    <LearnScreen
      userId={auth.auth.userId}
      auth={toAuthContext(auth.auth, auth.updateTokens)}
      onOpenLesson={(lessonId) => parent?.navigate('LessonPlayer', { lessonId })}
    />
  );
}

function ProgressRoute() {
  const auth = useAuth();
  if (!auth.auth) {
    return null;
  }

  return <ProgressScreen userId={auth.auth.userId} auth={toAuthContext(auth.auth, auth.updateTokens)} />;
}

function ProfileRoute() {
  const auth = useAuth();
  if (!auth.auth) {
    return null;
  }

  return (
    <ProfileScreen
      userId={auth.auth.userId}
      auth={toAuthContext(auth.auth, auth.updateTokens)}
      onLogout={auth.logout}
    />
  );
}

function TabsRoute() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" component={HomeRoute} />
      <Tabs.Screen name="learn" component={LearnRoute} />
      <Tabs.Screen name="progress" component={ProgressRoute} />
      <Tabs.Screen name="profile" component={ProfileRoute} />
    </Tabs.Navigator>
  );
}

type LessonPlayerRouteProps = NativeStackScreenProps<AppStackParamList, 'LessonPlayer'>;

function LessonPlayerRoute(props: LessonPlayerRouteProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  if (!auth.auth) {
    return null;
  }

  const userId = auth.auth.userId;
  const authContext = toAuthContext(auth.auth, auth.updateTokens);

  return (
    <LessonPlayerScreen
      userId={userId}
      lessonId={props.route.params.lessonId}
      auth={authContext}
      onExit={(updated) => {
        if (updated) {
          queryClient.invalidateQueries({ queryKey: queryKeys.today(userId) }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(userId) }).catch(() => undefined);
        }
        props.navigation.goBack();
      }}
    />
  );
}

type ReviewPlayerRouteProps = NativeStackScreenProps<AppStackParamList, 'ReviewPlayer'>;

function ReviewPlayerRoute(props: ReviewPlayerRouteProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  if (!auth.auth) {
    return null;
  }

  const userId = auth.auth.userId;
  const authContext = toAuthContext(auth.auth, auth.updateTokens);

  return (
    <ReviewPlayerScreen
      userId={userId}
      auth={authContext}
      onExit={(updated) => {
        if (updated) {
          queryClient.invalidateQueries({ queryKey: queryKeys.today(userId) }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: queryKeys.progress(userId) }).catch(() => undefined);
          queryClient.invalidateQueries({ queryKey: queryKeys.learningPath(userId) }).catch(() => undefined);
        }
        props.navigation.goBack();
      }}
    />
  );
}

// Exposed for focused navigator tests so query invalidation branches can be verified without full-stack navigation setup.
export const __testables = {
  toAuthContext,
  LessonPlayerRoute,
  ReviewPlayerRoute
} as const;

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsRoute} />
      <Stack.Screen
        name="LessonPlayer"
        component={LessonPlayerRoute}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ReviewPlayer"
        component={ReviewPlayerRoute}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
