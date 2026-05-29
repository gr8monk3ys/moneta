import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, type InitialState } from '@react-navigation/native';
import { createTestQueryClient } from './testUtils';
import { AppNavigator, __testables as appNavigatorTestables } from '../src/navigation/AppNavigator';

const mockUseAuth = jest.fn();
const mockLogout = jest.fn();
let mockLessonExitUpdated = true;
let mockReviewExitUpdated = true;

jest.mock('../src/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../src/screens/HomeScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    HomeScreen: ({ onOpenLesson, onStartReviews }: { onOpenLesson: (lessonId: string) => void; onStartReviews: () => void }) => (
      <View>
        <Text>Home Mock</Text>
        <Pressable onPress={() => onOpenLesson('lesson-1')}>
          <Text>Open Lesson</Text>
        </Pressable>
        <Pressable onPress={onStartReviews}>
          <Text>Open Reviews</Text>
        </Pressable>
      </View>
    )
  };
});

jest.mock('../src/screens/LearnScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    LearnScreen: ({ onOpenLesson }: { onOpenLesson: (lessonId: string) => void }) => (
      <View>
        <Text>Learn Mock</Text>
        <Pressable onPress={() => onOpenLesson('lesson-2')}>
          <Text>Learn Lesson</Text>
        </Pressable>
      </View>
    )
  };
});

jest.mock('../src/screens/ProgressScreen', () => {
  const { Text } = require('react-native');
  return { ProgressScreen: () => <Text>Progress Mock</Text> };
});

jest.mock('../src/screens/ProfileScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    ProfileScreen: ({ onLogout }: { onLogout: () => void }) => (
      <View>
        <Text>Profile Mock</Text>
        <Pressable onPress={onLogout}>
          <Text>Profile Logout</Text>
        </Pressable>
      </View>
    )
  };
});

jest.mock('../src/screens/LessonPlayerScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    LessonPlayerScreen: ({ onExit, lessonId }: { onExit: (updated: boolean) => void; lessonId: string }) => (
      <View>
        <Text>{`Lesson Mock ${lessonId}`}</Text>
        <Pressable onPress={() => onExit(mockLessonExitUpdated)}>
          <Text>Finish Lesson</Text>
        </Pressable>
      </View>
    )
  };
});

jest.mock('../src/screens/ReviewPlayerScreen', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    ReviewPlayerScreen: ({ onExit }: { onExit: (updated: boolean) => void }) => (
      <View>
        <Text>Review Mock</Text>
        <Pressable onPress={() => onExit(mockReviewExitUpdated)}>
          <Text>Finish Reviews</Text>
        </Pressable>
      </View>
    )
  };
});

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLessonExitUpdated = true;
    mockReviewExitUpdated = true;
    mockUseAuth.mockReturnValue({
      auth: {
        accessToken: 'a',
        refreshToken: 'r',
        userId: 'u1',
        sessionId: 's1'
      },
      updateTokens: jest.fn(),
      logout: mockLogout
    });
  });

  it('routes through tabs and invalidates queries after lesson and review exits', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    );

    expect(screen.getByText('Home Mock')).toBeTruthy();

    fireEvent.press(screen.getByText('Open Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Lesson Mock lesson-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Home Mock')).toBeTruthy();
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(4);
    // Completing a lesson can change entitlement-derived limits, so it must be invalidated too.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: expect.arrayContaining(['entitlement']) });

    fireEvent.press(screen.getByText('Open Reviews'));
    await waitFor(() => {
      expect(screen.getByText('Review Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish Reviews'));
    await waitFor(() => {
      expect(screen.getByText('Home Mock')).toBeTruthy();
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(8);

    fireEvent.press(screen.getByText('Learn'));
    await waitFor(() => {
      expect(screen.getByText('Learn Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Learn Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Lesson Mock lesson-2')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Learn Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Progress'));
    await waitFor(() => {
      expect(screen.getByText('Progress Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Me'));
    await waitFor(() => {
      expect(screen.getByText('Profile Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Profile Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('skips query invalidation when modal screens exit without updates', async () => {
    mockLessonExitUpdated = false;
    mockReviewExitUpdated = false;

    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    );

    fireEvent.press(screen.getByText('Open Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Lesson Mock lesson-1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish Lesson'));
    await waitFor(() => {
      expect(screen.getByText('Home Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Open Reviews'));
    await waitFor(() => {
      expect(screen.getByText('Review Mock')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finish Reviews'));
    await waitFor(() => {
      expect(screen.getByText('Home Mock')).toBeTruthy();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('returns null for protected routes when auth is unavailable', async () => {
    mockUseAuth.mockReturnValue({
      auth: null,
      updateTokens: jest.fn(),
      logout: mockLogout
    });

    const queryClient = createTestQueryClient();
    const screen = render(
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    );

    expect(screen.queryByText('Home Mock')).toBeNull();

    fireEvent.press(screen.getByText('Learn'));
    fireEvent.press(screen.getByText('Progress'));
    fireEvent.press(screen.getByText('Me'));

    expect(screen.queryByText('Learn Mock')).toBeNull();
    expect(screen.queryByText('Progress Mock')).toBeNull();
    expect(screen.queryByText('Profile Mock')).toBeNull();

    screen.unmount();

    const lessonModal = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <NavigationContainer
          initialState={{
            index: 1,
            routes: [
              { name: 'Tabs' },
              { name: 'LessonPlayer', params: { lessonId: 'lesson-1' } }
            ]
          } as InitialState}
        >
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    );

    expect(lessonModal.queryByText('Lesson Mock lesson-1')).toBeNull();
    lessonModal.unmount();

    const reviewModal = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <NavigationContainer
          initialState={{
            index: 1,
            routes: [
              { name: 'Tabs' },
              { name: 'ReviewPlayer' }
            ]
          } as InitialState}
        >
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    );

    expect(reviewModal.queryByText('Review Mock')).toBeNull();
  });

  it('invalidates lesson queries directly from the lesson modal route', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const goBack = jest.fn();

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <appNavigatorTestables.LessonPlayerRoute
          navigation={{ goBack } as never}
          route={{ key: 'lesson-player', name: 'LessonPlayer', params: { lessonId: 'lesson-9' } } as never}
        />
      </QueryClientProvider>
    );

    fireEvent.press(screen.getByText('Finish Lesson'));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(4);
    });
    expect(goBack).toHaveBeenCalled();
  });

  it('swallows lesson invalidation failures before navigating back', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('cache down'));
    const goBack = jest.fn();

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <appNavigatorTestables.LessonPlayerRoute
          navigation={{ goBack } as never}
          route={{ key: 'lesson-player', name: 'LessonPlayer', params: { lessonId: 'lesson-10' } } as never}
        />
      </QueryClientProvider>
    );

    fireEvent.press(screen.getByText('Finish Lesson'));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(4);
    });
    expect(goBack).toHaveBeenCalled();
  });

  it('invalidates review queries directly from the review modal route', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const goBack = jest.fn();

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <appNavigatorTestables.ReviewPlayerRoute
          navigation={{ goBack } as never}
          route={{ key: 'review-player', name: 'ReviewPlayer' } as never}
        />
      </QueryClientProvider>
    );

    fireEvent.press(screen.getByText('Finish Reviews'));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(4);
    });
    expect(goBack).toHaveBeenCalled();
  });

  it('swallows review invalidation failures before navigating back', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('cache down'));
    const goBack = jest.fn();

    const screen = render(
      <QueryClientProvider client={queryClient}>
        <appNavigatorTestables.ReviewPlayerRoute
          navigation={{ goBack } as never}
          route={{ key: 'review-player', name: 'ReviewPlayer' } as never}
        />
      </QueryClientProvider>
    );

    fireEvent.press(screen.getByText('Finish Reviews'));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledTimes(4);
    });
    expect(goBack).toHaveBeenCalled();
  });
});
