import { Trove, Decimal } from "lib-base";
import { Abi, Narrow } from "viem";
import { Vault } from "../libs/Vault";
import appConfig from "../appConfig.json";
import { Coin, JsonObject } from "../libs/types";
import BigNumber from "bignumber.js";
import { IOTX, globalContants } from "../libs/globalContants";
import assert from "assert";

export const shortenAddress = (address: string, b = 6, e = 4) => address.substr(0, b) + "..." + address.substr(-e);

export const calculateAvailableWithdrawal = (forTrove: Vault, price: number, collRatio?: number, chainId?: number) => {
	// const collateralRatio: number = collRatio ?? (appConfig.constants as JsonObject)[String(chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO;
	// const collateralValue = forTrove.collateral.multipliedBy(price);
	// const debtLine = forTrove.debt.multipliedBy(collateralRatio);
	// if (collateralValue.gt(debtLine))
	// 	return collateralValue.minus(debtLine).dividedBy(price);
	// else
	// 	return globalContants.BIG_NUMBER_0;
};

export const calculateAvailableBorrow = (forTrove: Vault, price: number, collRatio?: number, chainId?: number) => {
	// const collateralRatio: number = collRatio ?? (appConfig.constants as JsonObject)[String(chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO;
	// const collateralValue = forTrove.collateral.multipliedBy(price);
	// const debtLine = collateralValue.dividedBy(collateralRatio);
	// const debt = forTrove.debt.gt(1) ? forTrove.netDebt : forTrove.debt;
	// if (debtLine.gt(debt)) {
	// 	return debtLine.minus(debt);
	// } else
	// 	return globalContants.BIG_NUMBER_0;
};

// export const calculateAvailableBorrow = (collateral: BigNumber, netDebt: BigNumber, price: number, collRatio?: number, chainId?: number) => {
// 	const collateralRatio: number = collRatio ?? (appConfig.constants as JsonObject)[String(chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO;
// 	const collateralValue = collateral.multipliedBy(price);
// 	const debtLine = collateralValue.dividedBy(collateralRatio);
// 	const debt = netDebt;
// 	if (debtLine.gt(debt)) {
// 		return debtLine.minus(debt);
// 	} else
// 		return globalContants.BIG_NUMBER_0;
// };

export const calculateUtilizationRate = (forTrove: Trove, price: Decimal) => {
	return (forTrove.collateral.gt(0) && forTrove.debt.gt(0)) ? Decimal.ONE.div(forTrove.collateralRatio(price)) : Decimal.ZERO;
};

export const feeFrom = (original: Trove, edited: Trove, borrowingRate: Decimal): Decimal => {
	const change = original.whatChanged(edited, borrowingRate);

	if (change && change.type !== "invalidCreation" && change.params.borrowLUSD) {
		return change.params.borrowLUSD.mul(borrowingRate);
	} else {
		return Decimal.ZERO;
	}
};

export const loadABI = async (url: string): Promise<Narrow<Abi | readonly unknown[]> | undefined> => {
	try {
		return await (await fetch(url)).json();
	} catch (error) {
		console.error(error);
		return;
	}
};

export const formatAssetAmount = (bn: BigNumber, decimals = 18) => {
	return bn.shiftedBy(-decimals).toNumber();
};

export const formatCurrency = (value: number) => {
	return value.toLocaleString("en-US", {
		style: "currency",
		minimumFractionDigits: 0,
		maximumFractionDigits: globalContants.DECIMALS_2,
		currency: "USD",
		notation: "compact",
		compactDisplay: "short",
	});
};

export const formatAsset = (amount: number, asset: Coin = IOTX, compact = false) => {
	return amount.toLocaleString("en-US", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: globalContants.DECIMALS_2,
		notation: compact ? "compact" : "standard",
		compactDisplay: "short",
	}) + " " + asset.symbol;
};

export const formatPercent = (value: number) => {
	return value.toLocaleString("en-US", {
		style: "percent",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2		// minimumFractionDigits: globalContants.DECIMALS_2
	});
};

export function* generateTrials(totalNumberOfTrials: number, chainId: number) {
	assert(Number.isInteger(totalNumberOfTrials) && totalNumberOfTrials > 0);

	while (totalNumberOfTrials) {
		const numberOfTrials = Math.min(totalNumberOfTrials, (appConfig.constants as JsonObject)[String(chainId)].maxNumberOfTrialsAtOnce);
		yield numberOfTrials;

		totalNumberOfTrials -= numberOfTrials;
	}
}

export const randomInteger = () => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

export const formatNumber = (value: number, decimals = globalContants.DECIMALS_2) => {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
		compactDisplay: "short"
		// notation:"compact"
	})
};