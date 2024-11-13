/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOTX, WEN, globalContants } from "./globalContants";
import { Coin, JsonObject, VaultStatus, VaultStatus4Contract, VaultStatus4Subgraph, VaultStatusWithinMagma, Vaultish } from "./types";
import { BigNumber } from "bignumber.js";
import appConfig from "../appConfig.json"
import { magma } from "./magma";
import { zeroAddress } from "viem";

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
	get collateralToken() {
		return this._collateralToken;
	}

	private _loanToken: Coin = WEN;
	private _gasCompensation = globalContants.BIG_NUMBER_0;
	private _borrowingRate = 0;
	private _chainId = globalContants.DEFAULT_NETWORK_ID;

	constructor(vault: Vaultish, collateralToken: Coin = IOTX, gasCompensation?: BigNumber, borrowingRate?: number, chainId = globalContants.DEFAULT_NETWORK_ID) {
		this._collateralToken = collateralToken;

		this.id = vault.id;
		this.owner = vault.id;
		this._chainId = chainId;

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

		if (vault.status) this.status = vault.status;
		if (
			this.status === VaultStatus4Subgraph.closedByRedemption ||
			this.status === VaultStatus4Contract.closedByRedemption ||
			this.status === VaultStatus4Subgraph.closedByLiquidation ||
			this.status === VaultStatus4Contract.closedByLiquidation
		) {
			this.status = VaultStatusWithinMagma.limitedByRedemption;
			this.updateCollateralWithCollSurplusPool();
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

	public static calculateAvailableWithdrawal(collateral: BigNumber, debt: BigNumber, collateralPrice: number, collateralRatio: number, collateralToken: Coin, loanToken: Coin) {
		const collateralValue = collateral.shiftedBy(-collateralToken.decimals).multipliedBy(collateralPrice);
		const debtLine = debt.shiftedBy(-loanToken.decimals).multipliedBy(collateralRatio);
		if (collateralValue.gt(debtLine))
			return collateralValue.minus(debtLine).dividedBy(collateralPrice).shiftedBy(collateralToken.decimals);
		else
			return globalContants.BIG_NUMBER_0;
	}

	public static calculateAvailableBorrow(collateral: BigNumber, debt: BigNumber, collateralPrice: number, collateralToken: Coin, loanToken: Coin, collateralRatio: number, feeRate = 0, offset = 1, CCR = 1) {
		const collateralValue = collateral.shiftedBy(-collateralToken.decimals).multipliedBy(collateralPrice);
		const debtLine = collateralValue.dividedBy(CCR > 1 ? CCR : collateralRatio).multipliedBy(offset);
		const debtValue = debt.shiftedBy(-loanToken.decimals);
		if (debtLine.gt(debtValue)) {
			return debtLine.minus(debtValue).shiftedBy(loanToken.decimals).multipliedBy(1 - feeRate);
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

	public async updateCollateralWithCollSurplusPool() {
		const res = await magma.getCollSurplusPoolContract(this.collateralToken.symbol).getCollateral(this.owner);
		this.collateral = BigNumber(res._hex);
		this.collateralDecimals = this.collateral.shiftedBy(-this._collateralToken.decimals).toNumber();
	}

	public nominalCollateralRatio(): number {
		return Vault.calculateNominalCollateralRatio(this.collateral, this.debt);
	}

	public collateralRatio(collateralPrice: number): number {
		return Vault.computeCollateralRatio(this.collateral, this.debt, collateralPrice, 1, this._collateralToken, this._loanToken);
	}

	public getAvailabelBorrow(
		collateralPrice: number,
		collateralRatio = (appConfig.constants as JsonObject)[String(this._chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO,
		feeRate = 0,
		offset = 1,
		CCR = 1
	) {
		return Vault.calculateAvailableBorrow(
			this.collateral,
			this.debt,
			collateralPrice,
			this._collateralToken,
			this._loanToken,
			collateralRatio,
			feeRate,
			offset,
			CCR
		);
	}

	public getAvailableWithdrawal(collateralPrice: number, collateralRatio = (appConfig.constants as JsonObject)[String(this._chainId)].MAGMA_CRITICAL_COLLATERAL_RATIO) {
		return Vault.calculateAvailableWithdrawal(
			this.collateral,
			this.debt,
			collateralPrice,
			collateralRatio,
			this._collateralToken,
			this._loanToken
		);
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
		onDone?: (tx: string) => void,
		market: Coin = IOTX
	) {
		const nominalCollateralRatio = Vault.calculateNominalCollateralRatio(updatedCollateral, updatedDebt);
		const hints = await magma.findHintsForNominalCollateralRatio(nominalCollateralRatio, this.owner, market);
		const amount = deposit.toFixed();

		if (this._collateralToken.address && this._collateralToken.address !== zeroAddress) {
			const func = () => {
				magma.borrowerOperationsContract?.dappFunctions["adjustTrove(address,uint256,uint256,uint256,uint256,bool,address,address)"].run(
					onWait,
					onFail,
					onDone,
					undefined,
					this._collateralToken.address,
					amount,
					BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
					collWithdrawal.toFixed(),
					debtChange.toFixed(),
					isDebtIncrease,
					hints[0],
					hints[1]
				);
			};

			if (deposit.gt(0)) {
				magma.tokenContract[this._collateralToken.symbol].dappFunctions.approve.run(
					undefined,
					onFail,
					func,
					undefined,
					magma.borrowerOperationsContract?.address,
					amount
				);
			} else {
				func();
			}
		} else {
			magma.borrowerOperationsContract?.dappFunctions["adjustTrove(uint256,uint256,uint256,bool,address,address)"].run(
				onWait,
				onFail,
				onDone,
				{ value: amount },
				BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
				collWithdrawal.toFixed(),
				debtChange.toFixed(),
				isDebtIncrease,
				hints[0],
				hints[1]
			);
		}
	}

	public claimCollateral(
		onWait?: (tx: string) => void,
		onFail?: (error: Error | any) => void,
		onDone?: (tx: string) => void
	) {
		if (this.collateralToken.address === zeroAddress) {
			magma.borrowerOperationsContract?.dappFunctions["claimCollateral()"].run(onWait, onFail, onDone, undefined);
		} else {
			magma.borrowerOperationsContract?.dappFunctions["claimCollateral(address)"].run(onWait, onFail, onDone, undefined, this.collateralToken.address);
		}
	}

	_computeNetDebt() {
		if (this.debt.eq(0)) {
			this.netDebt = globalContants.BIG_NUMBER_0;
		} else {
			this.netDebt = this.debt.minus(this._gasCompensation);
		}

		this.nominalNetDebt = this.netDebt;
		this.netDebtDecimals = this.netDebt.shiftedBy(-this._loanToken.decimals).toNumber();
	}
}