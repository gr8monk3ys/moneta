import { queryKeys } from '../src/lib/queryKeys';

describe('queryKeys', () => {
  it('builds stable query keys for lesson and entitlement lookups', () => {
    expect(queryKeys.lesson('lesson-1')).toEqual(['lesson', 'lesson-1']);
    expect(queryKeys.entitlement('user-1')).toEqual(['entitlement', 'user-1']);
  });
});
