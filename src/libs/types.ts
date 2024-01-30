import { Decimal, Trove, FrontendStatus, UserTrove } from "lib-base";
import { Vault } from "./Vault";
import { BigNumber } from "bignumber.js"

export type OptionItem = {
	icon?: string;
	title?: string;
	key?: string;
	disabled?: boolean;
};

export type Coin = {
	symbol: string;
	logo: string;
	decimals: number;
};

export type ValidationContext = {
	price: Decimal;
	total: Trove;
	accountBalance: Decimal;
	lusdBalance: Decimal;
	numberOfTroves: number;
};

export type ValidationContextForStabilityPool = {
	trove: UserTrove;
	lusdBalance: Decimal;
	haveOwnFrontend: boolean;
	haveUndercollateralizedTroves: boolean;
};

export type ErrorMessage = {
	string?: string;
	key?: string;
	values?: Record<string, string>;
}

export type AccountForSubgraph = {
	id: string;
}

export type TroveInTx = {
	id: string;
	owner: AccountForSubgraph;
}

export enum TroveOperation {
	OpenTrove = "openTrove",
	AdjustTrove = "adjustTrove",
	CloseTrove = "closeTrove",
	RedeemCollateral = "redeemCollateral",
	LiquidateInNormalMode = "liquidateInNormalMode"
}

export type TxForSubgraph = {
	id: string;
	timestamp: number
}

export type TroveChangeTx = {
	id: string;
	trove: TroveInTx;
	troveOperation: TroveOperation;
	collateralChange: string;
	debtChange: string;
	sequenceNumber: number;
	transaction: TxForSubgraph;
}

export type TroveChangeData = {
	collateralAfter: number;
	debtAfter: number;
	timestamp: number;
	date: string;
}

// export type LiquidatableTrove = UserTrove & { liquidatable: boolean; }
export type LiquidatableTrove = Vault & { liquidatable: boolean; }

export type JsonObject = { [key: string]: any };

export type MixedError = {
	reason?: string;
	message?: string;
}

export type DepositByReferrer = {
	address: string,
	depositedAmount: number,
	latestTransaction?: string,
	lastUpdate?: number;
}

export type VaultStatus = "open" | "closedByOwner" | "closedByRedemption";

export type Vaultish = {
	id: string;
	status?: VaultStatus;
	collateral?: BigNumber;
	debt?: BigNumber;
	collateralRatioSortKey?: string
}

export type callRequest = {
	resultBox?: Record<string, any>;
	key?: string;
	contractAddress: string;
	call: string;
	parseFunc: (args: string[]) => void;
}