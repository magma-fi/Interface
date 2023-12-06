import { Trove, Decimal, CRITICAL_COLLATERAL_RATIO } from "lib-base";

export const shortenAddress = (address: string) => address.substr(0, 6) + "..." + address.substr(-4);

export const calculateAvailableWithdrawal = (forTrove: Trove, price: Decimal) => {
	const collateralValue = forTrove.collateral.mul(price);
	const debtLine = forTrove.netDebt.mul(CRITICAL_COLLATERAL_RATIO);
	if (collateralValue.gt(debtLine))
		return collateralValue.sub(debtLine).div(price);
	else
		return Decimal.ZERO;
};

export const calculateAvailableBorrow = (forTrove: Trove, price: Decimal) => {
	const collateralValue = forTrove.collateral.mul(price);
	const debtLine = collateralValue.div(CRITICAL_COLLATERAL_RATIO);
	if (debtLine.gt(forTrove.netDebt)) {
		return debtLine.sub(forTrove.netDebt);
	} else
		return Decimal.ZERO;
};

export const calculateUtilizationRate = (forTrove: Trove, price: Decimal) => {
	return (forTrove.collateral.gt(0) && forTrove.debt.gt(0)) ? Decimal.ONE.div(forTrove.collateralRatio(price)) : Decimal.ZERO;
};