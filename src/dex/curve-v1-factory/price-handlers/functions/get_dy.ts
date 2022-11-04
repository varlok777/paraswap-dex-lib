import { ImplementationNames, PoolState } from '../../types';
import { funcName } from '../../../../utils';
import { get_dy, IPoolContext } from '../types';
import { requireConstant } from './utils';

const factoryPlain2Basic: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
): bigint => {
  const { PRECISION, FEE_DENOMINATOR } = self.constants;
  const { rate_multipliers } = state.constants;
  const rates = [...rate_multipliers];
  const xp = self._xp_mem(self, rates, state.balances);

  const x = xp[i] + (dx * rates[i]) / PRECISION;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = xp[j] - y - 1n;
  const _fee = (state.fee * dy) / FEE_DENOMINATOR;
  return ((dy - _fee) * PRECISION) / rates[j];
};

const factoryPlain2Optimized: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
): bigint => {
  const { FEE_DENOMINATOR } = self.constants;
  const xp = [...state.balances];

  const x = xp[i] + dx;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = xp[j] - y - 1n;
  const fee = (state.fee * dy) / FEE_DENOMINATOR;
  return dy - fee;
};

const factoryV1MetaUsd: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
): bigint => {
  if (state.basePoolState?.virtualPrice === undefined) {
    throw new Error(
      `${self.IMPLEMENTATION_NAME} ${funcName}: basePoolState virtualPrice is undefined`,
    );
  }

  const { PRECISION, FEE_DENOMINATOR } = self.constants;
  const { rate_multipliers } = state.constants;
  const rates = [rate_multipliers[0], state.basePoolState?.virtualPrice];
  const xp = self._xp_mem(self, rates, state.balances);

  const x = xp[i] + (dx * rates[i]) / PRECISION;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = xp[j] - y - 1n;
  const _fee = (state.fee * dy) / FEE_DENOMINATOR;
  return ((dy - _fee) * PRECISION) / rates[j];
};

const customPlain3CoinThree: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
): bigint => {
  const { FEE_DENOMINATOR, PRECISION } = self.constants;
  const RATES = requireConstant(self, 'RATES', funcName());
  const rates = [...RATES];
  const xp = self._xp(self, state);

  const x = xp[i] + (dx * rates[i]) / PRECISION;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = ((xp[j] - y - 1n) * PRECISION) / rates[j];
  const _fee = (state.fee * dy) / FEE_DENOMINATOR;
  return dy - _fee;
};

const customPlain2CoinFrax: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
): bigint => {
  const { FEE_DENOMINATOR, PRECISION } = self.constants;
  const RATES = requireConstant(self, 'RATES', funcName());
  const rates = [...RATES];
  const xp = self._xp(self, state);

  const x = xp[i] + (dx * rates[i]) / PRECISION;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = xp[j] - y - 1n;
  const fee = (state.fee * dy) / FEE_DENOMINATOR;
  return ((dy - fee) * PRECISION) / rates[j];
};

const customPlain3CoinBtc: get_dy = (
  self: IPoolContext,
  state: PoolState,
  i: number,
  j: number,
  dx: bigint,
) => {
  const { PRECISION, FEE_DENOMINATOR } = self.constants;
  const rates = self._rates(self, state);
  const xp = self._xp(self, state);

  const x = xp[i] + (dx * rates[i]) / PRECISION;
  const y = self.get_y(self, state, i, j, x, xp);
  const dy = ((xp[j] - y - 1n) * PRECISION) / rates[j];
  const _fee = (state.fee * dy) / FEE_DENOMINATOR;
  return dy - _fee;
};

const implementations: Record<ImplementationNames, get_dy> = {
  [ImplementationNames.CUSTOM_PLAIN_2COIN_FRAX]: customPlain2CoinFrax,
  [ImplementationNames.CUSTOM_PLAIN_2COIN_RENBTC]: customPlain3CoinBtc,
  [ImplementationNames.CUSTOM_PLAIN_3COIN_SBTC]: customPlain3CoinBtc,
  [ImplementationNames.CUSTOM_PLAIN_3COIN_THREE]: customPlain3CoinThree,

  [ImplementationNames.FACTORY_V1_META_BTC]: factoryV1MetaUsd,
  [ImplementationNames.FACTORY_V1_META_USD]: factoryV1MetaUsd,

  [ImplementationNames.FACTORY_META_BTC]: factoryV1MetaUsd,
  [ImplementationNames.FACTORY_META_BTC_BALANCES]: factoryV1MetaUsd,

  [ImplementationNames.FACTORY_META_BTC_REN]: factoryV1MetaUsd,
  [ImplementationNames.FACTORY_META_BTC_BALANCES_REN]: factoryV1MetaUsd,

  [ImplementationNames.FACTORY_META_USD]: factoryV1MetaUsd,
  [ImplementationNames.FACTORY_META_USD_BALANCES]: factoryV1MetaUsd,

  [ImplementationNames.FACTORY_META_USD_FRAX_USDC]: factoryV1MetaUsd,
  [ImplementationNames.FACTORY_META_USD_BALANCES_FRAX_USDC]: factoryV1MetaUsd,

  [ImplementationNames.FACTORY_PLAIN_2_BALANCES]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_2_BASIC]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_2_ETH]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_2_OPTIMIZED]: factoryPlain2Optimized,

  [ImplementationNames.FACTORY_PLAIN_3_BALANCES]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_3_BASIC]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_3_ETH]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_3_OPTIMIZED]: factoryPlain2Optimized,

  [ImplementationNames.FACTORY_PLAIN_4_BALANCES]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_4_BASIC]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_4_ETH]: factoryPlain2Basic,
  [ImplementationNames.FACTORY_PLAIN_4_OPTIMIZED]: factoryPlain2Optimized,
};

export default implementations;