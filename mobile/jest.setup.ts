import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

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
