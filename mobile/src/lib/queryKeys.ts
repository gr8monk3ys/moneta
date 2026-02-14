export const queryKeys = {
  today: (userId: string) => ['today', userId] as const,
  progress: (userId: string) => ['progress', userId] as const,
  learningPath: (userId: string) => ['learning-path', userId] as const,
  lesson: (lessonId: string) => ['lesson', lessonId] as const,
  entitlement: (userId: string) => ['entitlement', userId] as const
};

