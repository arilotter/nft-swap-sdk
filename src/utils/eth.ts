import startsWith from 'lodash/startsWith';
import isString from 'lodash/isString';
import { BigNumber } from '@0x/utils';
import { isHexString } from '@ethersproject/bytes';
import { getAddress } from '@ethersproject/address';

import type { ObjectMap, BigNumberIsh } from '../types';

export const CRYPTO_KITTIES_CONTRACT_ADDRESS =
  '0x06012c8cf97bead5deae237070f9587f8e7a266d';

export enum ChainId {
  Mainnet = 1,
  Kovan = 42,
  Ganache = 1337,
}

export const ETH_GAS_STATION_API_BASE_URL = 'https://ethgasstation.info';
export const ETH_GAS_STATION_GAS_ENDPOINT = `${ETH_GAS_STATION_API_BASE_URL}/json/ethgasAPI.json`;

export const MAX_UINT256 = new BigNumber(2).pow(128).minus(1);
export const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = MAX_UINT256;
export const GWEI_IN_WEI = new BigNumber(1000000000);
export const GWEI_IN_ETH = new BigNumber(1000000000);

export const ZERO_AMOUNT = new BigNumber(0);
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NULL_BYTES = '0x';
export const BASE_TEN = 10;

export const ONE_NFT_UNIT = new BigNumber(1);
export const ZERO_NFT_UNIT = new BigNumber(0);
export const DEFAULT_ERC20_TOKEN_DECIMALS = new BigNumber(18);

export type Numberish = BigNumber | number | string;

const isENSAddressFormat = (address: string) => !!address.match(/.+\..+/g);

const isHexStringIgnorePrefix = (value: string) => {
  const trimmedValue = value.trim();
  const updatedValue = addHexPrefix(trimmedValue);
  return isHexString(updatedValue);
};

const addHexPrefix = (value: string) =>
  startsWith(value, '0x') ? value : `0x${value}`;

const convertRawAmountToDecimalFormat = (
  value: BigNumber,
  decimals: Numberish = new BigNumber(18),
  maxFormattedDecimals = 4
): string =>
  new BigNumber(value)
    .dividedBy(new BigNumber(10).pow(decimals))
    .decimalPlaces(maxFormattedDecimals)
    .toFormat(maxFormattedDecimals)
    .toString();

const getEthPriceInUsd = async (): Promise<number | undefined> => {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
  );
  const json = await res.json();
  return json?.ethereum?.usd;
};

const convertGweiToEth = (gweiAmount: BigNumber) => {
  const BASE_TEN = 10;
  const unit = new BigNumber(BASE_TEN).pow(-9);
  const gweiInEth = unit.times(gweiAmount);
  return gweiInEth;
};

/**
 *
 * @returns gas price in wei (base unit), need to convert to eth
 */
const getGasPrice = async (): Promise<BigNumber> => {
  try {
    const res = await fetch(ETH_GAS_STATION_GAS_ENDPOINT);
    const gasInfo = await res.json();
    // Eth Gas Station result is gwei * 10
    const BASE_TEN = 10;
    const gasPriceGwei = new BigNumber(gasInfo.fast / BASE_TEN);
    const unit = new BigNumber(BASE_TEN).pow(9);
    const gasPriceWei = unit.times(gasPriceGwei);
    return gasPriceWei;
  } catch (e) {
    throw new Error(e as any);
  }
};

// const toBaseUnitAmount = (amount: Numberish, decimals: number): BigNumber => {
//   const unit = new BigNumber(BASE_TEN).pow(decimals)
//   const baseUnitAmount = unit.times(amount)
//   const hasDecimals = baseUnitAmount.decimalPlaces() !== 0
//   if (hasDecimals) {
//     throw new Error(`Invalid unit amount: ${amount.toString(BASE_TEN)} - Too many decimal places`)
//   }
//   return baseUnitAmount
// }

const arrayToMapWithId = <T extends object>(
  array: T[],
  idKey: keyof T
): ObjectMap<T> => {
  const initialMap: ObjectMap<T> = {};
  return array.reduce((acc, val) => {
    const id = val[idKey] as any;
    acc[id] = val;
    return acc;
  }, initialMap);
};

const convertAmountToBigNumber = (value: BigNumberIsh): BigNumber => {
  const num = value || 0;
  const isBigNumber = BigNumber.isBigNumber(num);
  if (isBigNumber) {
    return num as BigNumber;
  }

  if (isString(num) && (num.indexOf('0x') === 0 || num.indexOf('-0x') === 0)) {
    return new BigNumber(num.replace('0x', ''), 16);
  }

  const baseTen = 10;
  return new BigNumber((num as number).toString(baseTen), baseTen);
};

const encodeAmountAsHexString = (value: BigNumberIsh): string => {
  const valueBigNumber = convertAmountToBigNumber(value);
  const hexBase = 16;
  const valueHex = valueBigNumber.toString(hexBase);

  return valueBigNumber.isLessThan(0)
    ? `-0x${valueHex.substr(1)}`
    : `0x${valueHex}`;
};

const isHexAddressFormat = (address: string): boolean => {
  if (!isHexString(address)) return false;
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }
  if (
    /^(0x)?[0-9a-f]{40}$/.test(address) ||
    /^(0x)?[0-9A-F]{40}$/.test(address)
  ) {
    return true;
  }
  return true;
};

export function getUrlForFallbackTokenIcon(address: string) {
  let checksummedAddress: string;
  try {
    checksummedAddress = getAddress(address);
  } catch {
    return null;
  }
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksummedAddress}/logo.png`;
}

// const getErrorMessageFromErrorCode = (
//   errorCode?: ERC20_BALANCE_ERROR_CODES | TOKEN_CONTRACT_ERROR_CODES
// ) => {
//   if (isNil(errorCode)) {
//     return;
//   }
//   switch (errorCode) {
//     case TOKEN_CONTRACT_ERROR_CODES.MISSING_CONTRACT_ADDRESS_ERROR:
//       return 'Token contract address missing';
//     case TOKEN_CONTRACT_ERROR_CODES.INVALID_CONTRACT_ADDRESS_ERROR:
//     case VALIDATION_ERROR_CODES.INVALID_CONTRACT_ADDRESS:
//       return 'Invalid token contract address';
//     case TOKEN_CONTRACT_ERROR_CODES.LOADING_CONTRACT_ADDRESS_ERROR:
//     case BALANCE_CHECK_ERROR_CODES.LOADING_CONTRACT_ADDRESS_ERROR:
//       return 'Error loading contract address';
//     case VALIDATION_ERROR_CODES.INVALID_ADDRESS_FORMAT:
//       return 'Incorrect wallet address';
//     case VALIDATION_ERROR_CODES.INVALID_ENS:
//       return 'Incorrect ENS name';
//     case VALIDATION_ERROR_CODES.INVALID_HEX_ADDRESS:
//       return 'Invalid hex address';
//     case BALANCE_CHECK_ERROR_CODES.BALANCE_LOOKUP_ERROR:
//       return 'Error looking up token balance';
//     default:
//       throw new Error(`Unhandled error code ${errorCode}`);
//   }
// };

const getShortenedAddress = (
  address: string,
  start: number = 6,
  end: number = 4
) => {
  const shortenedAddress = `${address.slice(0, start)}...${address.slice(
    -1 * end
  )}`;
  return shortenedAddress;
};

export const toUnitAmount = (amount: BigNumber, decimals: number) => {
  const unit = new BigNumber(BASE_TEN).pow(decimals);

  const unitAmount = amount.dividedBy(unit);
  const hasDecimals = unit.decimalPlaces() !== 0;
  if (hasDecimals) {
    throw new Error(
      `Invalid unit amount: ${amount.toString()}, incorrect decimals ${decimals}`
    );
  }
  return unitAmount;
};

export const toBaseUnitAmount = (
  amount: Numberish,
  decimals: number
): BigNumber => {
  const unit = new BigNumber(BASE_TEN).pow(decimals);
  const baseUnitAmount = unit.times(amount);
  const hasDecimals = baseUnitAmount.decimalPlaces() !== 0;
  if (hasDecimals) {
    throw new Error(
      `Invalid unit amount: ${amount.toString()} - Too many decimal places`
    );
  }
  return baseUnitAmount;
};

export const toNearestBaseUnitAmount = (
  amount: BigNumber,
  decimals: number
): BigNumber => {
  const unit = new BigNumber(BASE_TEN).pow(decimals);
  const baseUnitAmount = unit.times(amount);
  const nearestBaseUnitAmount = baseUnitAmount.decimalPlaces(0);
  return nearestBaseUnitAmount;
};

export const toBaseUnitAmountSafe = (
  amount?: BigNumber | string | number,
  decimals?: BigNumber | string | number
): BigNumber | undefined => {
  if (amount === undefined) {
    return undefined;
  }
  if (decimals === undefined) {
    return undefined;
  }
  return toBaseUnitAmount(
    new BigNumber(amount),
    new BigNumber(decimals).toNumber()
  );
};

const getEtherscanRootUrlForChain = (chainId: number) => {
  if (chainId === 4) {
    return 'https://rinkeby.etherscan.io';
  }
  return 'https://etherscan.io';
};

export const getEtherscanLinkFromTxHash = (txHash: string, chainId: number) => {
  if (!txHash) {
    return undefined;
  }
  const etherscanRoot = getEtherscanRootUrlForChain(chainId);
  const normalizedHash = txHash.replace(/-.*/g, '');
  const etherscanLink = `${etherscanRoot}/tx/${normalizedHash}`;
  return etherscanLink;
};

export const getEtherscanLinkForAccount = (
  account: string,
  chainId: number
) => {
  if (!account) {
    return undefined;
  }
  const etherscanRoot = getEtherscanRootUrlForChain(chainId);
  const normalizedAccount = account.replace(/-.*/g, '');
  const etherscanLink = `${etherscanRoot}/address/${normalizedAccount}`;
  return etherscanLink;
};

export const convertGweiToWei = (numInGwei: BigNumber) => {
  const numInWei = numInGwei.multipliedBy(GWEI_IN_WEI).toFixed(0);
  return numInWei;
};

export const convertWeiToGwei = (numInWei: BigNumber) => {
  const numInGwei = numInWei.div(GWEI_IN_WEI).toFixed(0);
  return numInGwei;
};

export {
  isENSAddressFormat,
  convertRawAmountToDecimalFormat,
  isHexAddressFormat,
  isHexStringIgnorePrefix,
  getGasPrice,
  getEthPriceInUsd,
  encodeAmountAsHexString,
  convertAmountToBigNumber,
  arrayToMapWithId,
  getShortenedAddress,
  convertGweiToEth,
};
