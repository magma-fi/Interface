import { IOTX, WEN, globalContants } from "./globalContants";
import { Coin, JsonObject, VaultStatus, Vaultish } from "./types";
import { BigNumber } from "bignumber.js";
import { BigNumber as BN } from "@ethersproject/bignumber";
import appConfig from "../appConfig.json"
import { magma } from "./magma";

export class Vault {
	public id: string;
	public owner: string;
	public status?: VaultStatus;
	public collateral: BigNumber = globalContants.BIG_NUMBER_0;
	public debt: BigNumber = globalContants.BIG_NUMBER_0;
	public netDebt: BigNumber = globalContants.BIG_NUMBER_0;
	public nominalNetDebt: BigNumber = globalContants.BIG_NUMBER_0;
	public debtDecimals = 0;
	public netDebtDecimals = 0;
	public collateralDecimals = 0;

	private _collateralToken: Coin = IOTX;
	private _loanToken: Coin = WEN;
	private _gasCompensation = globalContants.BIG_NUMBER_0;
	private _borrowingRate = 0;
	private _chainId = globalContants.DEFAULT_NETWORK_ID;

	constructor(vault: Vaultish, collateralToken: Coin = IOTX, gasCompensation?: BigNumber, borrowingRate?: number, chainId = globalContants.DEFAULT_NETWORK_ID) {
		this._collateralToken = collateralToken;

		this.id = vault.id;
		this.owner = vault.id;
		this._chainId = chainId;
		if (vault.status) this.status = vault.status;
		if (gasCompensation) this._gasCompensation = gasCompensation;
		if (borrowingRate) this._borrowingRate = borrowingRate;

		if (vault.collateral) {
			this.collateral = vault.collateral;
			this.collateralDecimals = this.collateral.shiftedBy(-this._collateralToken.decimals).toNumber();
		}

		if (vault.debt) {
			this.debt = vault.debt;
			this.debtDecimals = this.debt.shiftedBy(-this._loanToken.decimals).toNumber();
		}


		this._computeNetDebt();
	}

	public static computeCollateralRatio(collateral: BigNumber, debt: BigNumber, collateralPrice: number, loanPrice = 1, collateralToken: Coin, loanToken: Coin): number {
		if (debt.eq(0)) {
			return 0;
		} else {
			return collateral.shiftedBy(-collateralToken.decimals)
				.multipliedBy(collateralPrice)
				.dividedBy(
					debt.shiftedBy(-loanToken.decimals)
						.multipliedBy(loanPrice)
				).toNumber();
		}
	}

	public static calculateAvailableWithdrawal(collateral: BigNumber, netDebt: BigNumber, collateralPrice: number, chainId = globalContants.DEFAULT_NETWORK_ID, collateralToken: Coin, loanToken: Coin) {
		const collateralRatio: number = (appConfig.constants as JsonObject)[String(chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO;
		const collateralValue = collateral.shiftedBy(-collateralToken.decimals).multipliedBy(collateralPrice);
		const debtLine = netDebt.shiftedBy(-loanToken.decimals).multipliedBy(collateralRatio);
		if (collateralValue.gt(debtLine))
			return collateralValue.minus(debtLine).dividedBy(collateralPrice).shiftedBy(collateralToken.decimals);
		else
			return globalContants.BIG_NUMBER_0;
	}

	public static calculateAvailableBorrow(collateral: BigNumber, netDebt: BigNumber, collateralPrice: number, chainId = globalContants.DEFAULT_NETWORK_ID, collateralToken: Coin, loanToken: Coin, collRatio?: number, feeRate = 0) {
		const appConfigConstants = (appConfig.constants as JsonObject)[String(chainId)];
		const collateralRatio: number = collRatio ?? appConfigConstants.MAGMA_CRITICAL_COLLATERAL_RATIO;
		const collateralValue = collateral.shiftedBy(-collateralToken.decimals).multipliedBy(collateralPrice);
		const debtLine = collateralValue.dividedBy(collateralRatio);
		const debtValue = netDebt.shiftedBy(-loanToken.decimals);
		if (debtLine.gt(debtValue)) {
			return debtLine.minus(debtValue).shiftedBy(loanToken.decimals).multipliedBy(appConfigConstants.appMMROffset).multipliedBy(1 - feeRate);
		} else
			return globalContants.BIG_NUMBER_0;
	}

	public static calculateNominalCollateralRatio(collateral: BigNumber, debt: BigNumber): number {
		if (debt.eq(0)) {
			return Number.POSITIVE_INFINITY;
		} else {
			return collateral.multipliedBy(100).dividedBy(debt).toNumber();
		}
	}

	public nominalCollateralRatio(): number {
		return Vault.calculateNominalCollateralRatio(this.collateral, this.debt);
	}

	public collateralRatio(collateralPrice: number): number {
		return Vault.computeCollateralRatio(this.collateral, this.debt, collateralPrice, 1, this._collateralToken, this._loanToken);
	}

	public getAvailableWithdrawal(collateralPrice: number) {
		return Vault.calculateAvailableWithdrawal(this.collateral, this.netDebt, collateralPrice, this._chainId, this._collateralToken, this._loanToken);
	}

	public async adjust(
		maxFeePercentage: number,
		collWithdrawal: BigNumber,
		debtChange: BigNumber,
		isDebtIncrease: boolean,
		deposit: BigNumber,
		updatedCollateral: BigNumber,
		updatedDebt: BigNumber,
		onWait?: (tx: string) => void,
		onFail?: (error: Error | any) => void,
		onDone?: () => void
	) {
		const nominalCollateralRatio = Vault.calculateNominalCollateralRatio(updatedCollateral, updatedDebt);
		const hints = await magma.findHintsForNominalCollateralRatio(nominalCollateralRatio, this.owner);
		magma.borrowerOperationsContract?.dappFunctions.adjustTrove.run(
			onWait,
			onFail,
			onDone,
			{ value: deposit.toFixed() },
			BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
			collWithdrawal.toFixed(),
			debtChange.toFixed(),
			isDebtIncrease,
			hints[0],
			hints[1]
		);
	}

	_computeNetDebt() {
		if (this.debt.eq(0)) {
			this.netDebt = globalContants.BIG_NUMBER_0;
		} else {
			this.netDebt = this.debt.multipliedBy(1 + this._borrowingRate).plus(this._gasCompensation);
		}

		this.nominalNetDebt = this.debt.multipliedBy(1 + this._borrowingRate).plus(this._gasCompensation);
		this.netDebtDecimals = this.netDebt.shiftedBy(-this._loanToken.decimals).toNumber();
	}
}