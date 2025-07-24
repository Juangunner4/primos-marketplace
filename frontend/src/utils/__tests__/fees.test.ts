import { calculateFees } from '../fees';

describe('calculateFees', () => {
  test('computes fee breakdown', () => {
    const res = calculateFees(0.08);
    expect(res.totalFees).toBeCloseTo(0.0092);
    expect(res.sellerReceives).toBeCloseTo(0.0708);
  });
});
