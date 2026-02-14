import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import 'react-native-gesture-handler/jestSetup';
import { cleanup } from '@testing-library/react-native';
import { queryClient } from './src/lib/queryClient';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

afterEach(() => {
  cleanup();
  queryClient.clear();
});

jest.mock('expo-iap', () => ({
  initConnection: jest.fn().mockResolvedValue(undefined),
  endConnection: jest.fn().mockResolvedValue(undefined),
  fetchProducts: jest.fn().mockResolvedValue([]),
  requestPurchase: jest.fn().mockResolvedValue(null),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
  restorePurchases: jest.fn().mockResolvedValue(undefined),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  getReceiptIOS: jest.fn().mockResolvedValue(null)
}));
