import { Decimal, Trove, FrontendStatus, UserTrove } from "lib-base";

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
	RedeemCollateral = "redeemCollateral"
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

export type LiquidatableTrove = UserTrove & { liquidatable: boolean; }

export type JsonObject = { [key: string]: any };