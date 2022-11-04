import _ from 'lodash';
import { funcName } from '../../../../utils';
import { ImplementationNames, PoolState } from '../../types';
import { IPoolContext, _calc_withdraw_one_coin } from '../types';
import { requireConstant, throwNotImplemented } from './utils';

const customPlain3CoinThree: _calc_withdraw_one_coin = (
  self: IPoolContext,
  state: PoolState,
  _token_amount: bigint,
  i: number,
): [bigint, bigint, bigint | undefined] => {
  const { N_COINS, BI_N_COINS, FEE_DENOMINATOR } = self.constants;
  const PRECISION_MUL = requireConstant(self, 'PRECISION_MUL', funcName());

  if (state.totalSupply === undefined) {
    throw new Error(
      `${self.IMPLEMENTATION_NAME} ${funcName()}: totalSupply is not provided`,
    );
  }

  const amp = state.A;
  const _fee = (state.fee * BI_N_COINS) / (4n * (BI_N_COINS - 1n));
  const precisions = [...PRECISION_MUL];
  const total_supply = state.totalSupply;

  const xp = self._xp(self, state);

  const D0 = self.get_D(self, xp, amp);
  const D1 = D0 - (_token_amount * D0) / total_supply;
  const xp_reduced = [...xp];

  const new_y = self.get_y_D(self, amp, i, xp, D1);

  const dy_0 = (xp[i] - new_y) / precisions[i]; // w/o fees

  for (const j of _.range(N_COINS)) {
    let dx_expected = 0n;
    if (j === i) {
      dx_expected = (xp[j] * D1) / D0 - new_y;
    } else {
      dx_expected = xp[j] - (xp[j] * D1) / D0;
    }
    xp_reduced[j] -= (_fee * dx_expected) / FEE_DENOMINATOR;
  }
  let dy = xp_reduced[i] - self.get_y_D(self, amp, i, xp_reduced, D1);
  dy = (dy - 1n) / precisions[i]; // Withdraw less to account for rounding errors

  return [dy, dy_0 - dy, undefined];
};

const notImplemented: _calc_withdraw_one_coin = (
  self: IPoolContext,
  state: PoolState,
  _token_amount: bigint,
  i: number,
) => {
  return throwNotImplemented(
    '_calc_withdraw_one_coin',
    self.IMPLEMENTATION_NAME,
  );
};

const implementations: Record<ImplementationNames, _calc_withdraw_one_coin> = {
  [ImplementationNames.CUSTOM_PLAIN_2COIN_FRAX]: customPlain3CoinThree,
  [ImplementationNames.CUSTOM_PLAIN_2COIN_RENBTC]: customPlain3CoinThree,
  [ImplementationNames.CUSTOM_PLAIN_3COIN_SBTC]: customPlain3CoinThree,
  [ImplementationNames.CUSTOM_PLAIN_3COIN_THREE]: customPlain3CoinThree,

  [ImplementationNames.FACTORY_V1_META_BTC]: notImplemented,
  [ImplementationNames.FACTORY_V1_META_USD]: notImplemented,

  [ImplementationNames.FACTORY_META_BTC]: notImplemented,
  [ImplementationNames.FACTORY_META_BTC_BALANCES]: notImplemented,

  [ImplementationNames.FACTORY_META_BTC_REN]: notImplemented,
  [ImplementationNames.FACTORY_META_BTC_BALANCES_REN]: notImplemented,

  [ImplementationNames.FACTORY_META_USD]: notImplemented,
  [ImplementationNames.FACTORY_META_USD_BALANCES]: notImplemented,

  [ImplementationNames.FACTORY_META_USD_FRAX_USDC]: notImplemented,
  [ImplementationNames.FACTORY_META_USD_BALANCES_FRAX_USDC]: notImplemented,

  [ImplementationNames.FACTORY_PLAIN_2_BALANCES]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_2_BASIC]: CHANGE,
  [ImplementationNames.FACTORY_PLAIN_2_ETH]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_2_OPTIMIZED]: notImplemented,

  [ImplementationNames.FACTORY_PLAIN_3_BALANCES]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_3_BASIC]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_3_ETH]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_3_OPTIMIZED]: notImplemented,

  [ImplementationNames.FACTORY_PLAIN_4_BALANCES]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_4_BASIC]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_4_ETH]: notImplemented,
  [ImplementationNames.FACTORY_PLAIN_4_OPTIMIZED]: notImplemented,
};

export default implementations;