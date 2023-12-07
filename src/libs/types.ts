import { Decimal, Trove, FrontendStatus, UserTrove } from "lib-base";

export type OptionItem = {
	icon?: string;
	title?: string;
	key?: string;
};

export type Coin = {
	symbol: string;
	logo: string;
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
	key: string;
	values: Record<string, string>
}

export type TroveChangeTx = {
	id: string;
}