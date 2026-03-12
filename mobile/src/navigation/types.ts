export type AuthStackParamList = {
  Login: undefined;
  PasswordResetRequest: { email?: string } | undefined;
  PasswordResetConfirm: { email?: string } | undefined;
};

export type MainTabParamList = {
  home: undefined;
  learn: undefined;
  progress: undefined;
  profile: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  LessonPlayer: { lessonId: string };
  ReviewPlayer: undefined;
};
