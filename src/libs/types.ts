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
export type LiquidatableTrove = Vault & { liquidatable?: boolean; }

export type JsonObject = { [key: string]: any };

export type MixedError = {
	reason?: string;
	message?: string;
	data?: any;
}

export type DepositByReferrer = {
	address: string,
	depositedAmount: number,
	latestTransaction?: string,
	lastUpdate?: number;
}

export enum VaultStatus4Contract {
	active = 1,
	closedByOwner = 2,
	closedByLiquidation = 3,
	closedByRedemption = 4
}

export enum VaultStatus4Subgraph {
	open = 1,
	closedByOwner = 2,
	closedByLiquidation = 3,
	closedByRedemption = 4
}

export type VaultStatus = VaultStatus4Contract | VaultStatus4Contract

export type Vaultish = {
	id: string;
	status?: VaultStatus;
	collateral?: BigNumber;
	debt?: BigNumber;
	stake?: BigNumber;
	collateralRatioSortKey?: string,
	arrayIndex?: BigNumber;
}

export type callRequest = {
	resultBox?: Record<string, any>;
	key?: string;
	contractAddress: string;
	call: string;
	parseFunc: (args: ArrayLike<number> | string) => void;
}

export enum StabilityDepositOperation {
	depositTokens = "Stake",
	withdrawTokens = "Unstake",
	withdrawCollateralGain = "Claim"
}

export type StabilityTransactionRecord = {
	id: number;
	operation: StabilityDepositOperation;
	amount: number;
	timestamp: number;
	tx: string;
}

type ResultInApproxHintObject = {
	diff: BigNumber;
	hintAddress: string;
}

export type ApproxHintObject = {
	latestRandomSeed: BigNumber;
	results: ResultInApproxHintObject[];
}

export type LPScoreObject = {
	name: string
	staking: boolean;
	url: string;
	points?: number;
	link?: string;
	pointsPerHour: number;
}

export type StabilityDeposit = {
	collateralGain: BigNumber;
	currentLUSD: BigNumber;
	lqtyReward: BigNumber;
	initialValue: BigNumber;
	frontEndTag: string;
}