import { JsonFragment } from "@ethersproject/abi";
import { Trove, Decimal, CRITICAL_COLLATERAL_RATIO } from "lib-base";

export const shortenAddress = (address: string) => address.substr(0, 6) + "..." + address.substr(-4);

export const calculateAvailableWithdrawal = (forTrove: Trove, price: Decimal, collateralRatio: Decimal = CRITICAL_COLLATERAL_RATIO) => {
	const collateralValue = forTrove.collateral.mul(price);
	const debtLine = forTrove.debt.mul(collateralRatio);
	if (collateralValue.gt(debtLine))
		return collateralValue.sub(debtLine).div(price);
	else
		return Decimal.ZERO;
};

export const calculateAvailableBorrow = (forTrove: Trove, price: Decimal, collateralRatio: Decimal = CRITICAL_COLLATERAL_RATIO) => {
	const collateralValue = forTrove.collateral.mul(price);
	const debtLine = collateralValue.div(collateralRatio);
	const debt = forTrove.debt.gt(1) ? forTrove.netDebt : forTrove.debt;
	if (debtLine.gt(debt)) {
		return debtLine.sub(debt);
	} else
		return Decimal.ZERO;
};

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

export const loadABI = async (url: string): Promise<JsonFragment | undefined> => {
	try {
		return await (await fetch(url)).json();
	} catch (error) {
		console.error(error);
		return;
	}
};