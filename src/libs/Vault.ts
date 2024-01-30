import { WEN, globalContants } from "./globalContants";
import { Coin, VaultStatus, Vaultish } from "./types";
import { BigNumber } from "bignumber.js";

export class Vault {
	public id: string;
	public status?: VaultStatus;
	public collateral: BigNumber = globalContants.BIG_NUMBER_0;
	public debt: BigNumber = globalContants.BIG_NUMBER_0;

	private _collateralToken: Coin;
	private _loanToken: Coin = WEN;

	constructor(vault: Vaultish, collateralToken: Coin) {
		this.id = vault.id;
		if (vault.status) this.status = vault.status;
		if (vault.collateral) this.collateral = vault.collateral;
		if (vault.debt) this.debt = vault.debt;

		this._collateralToken = collateralToken;
	}

	collateralRatio(collateralPrice: number, loanPrice = 1): BigNumber {
		return this.collateral.shiftedBy(-this._collateralToken.decimals)
			.multipliedBy(collateralPrice)
			.dividedBy(
				this.debt
					.shiftedBy(-this._loanToken.decimals)
					.multipliedBy(loanPrice)
			);
	}
}