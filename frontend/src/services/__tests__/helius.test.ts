import * as service from '../helius';
import * as utils from '../../utils/helius';

describe('helius service re-exports', () => {
  test('all functions are re-exported', () => {
    expect(service.getAssetsByCollection).toBe(utils.getAssetsByCollection);
    expect(service.getNFTByTokenAddress).toBe(utils.getNFTByTokenAddress);
    expect(service.checkPrimoHolder).toBe(utils.checkPrimoHolder);
    expect(service.fetchCollectionNFTsForOwner).toBe(
      utils.fetchCollectionNFTsForOwner
    );
  });
});
