import { Coin, OptionItem } from "./types";
import { BigNumber } from "bignumber.js";

export enum ModalAction {
	Stake = "stake",
	Unstake = "unstake",
	SwapWEN2IOTX = "swapWen2Iotx",
	ClaimRewards = "claimRewards"
}

export enum Langs {
	English = "english",
	Chinese = "中文"
}

export enum StyleModes {
	Light = "light",
	Dark = "dark"
}

export enum BadgeType {
	Deposit = "deposit",
	Withdraw = "withdraw",
	Borrow = "borrow",
	Repay = "repay",
	RecoveryMode = "recoveryMode",
	CloseTrove = "closeTrove",
	Id = "ID",
	Lock = "lockInDays",
	Stake = "stake",
	Unstake = "unstake",
	Claim = "claim"
}

export const MAGMA: Coin = {
	symbol: "MGM",
	logo: "images/magma.png",
	decimals: 18
}

export const WEN: Coin = {
	symbol: "WEN",
	logo: "images/wen.png",
	decimals: 18
}

export const IOTX: Coin = {
	symbol: "IOTX",
	logo: "images/iotx.png",
	decimals: 18
}

export const DAI: Coin = {
	symbol: "DAI",
	logo: "images/dai.png"
}

export const USDC: Coin = {
	symbol: "USDC",
	logo: "images/usdc.png"
}

export const LangOptions: OptionItem[] = [
	{
		title: Langs.English,
		icon: "images/en.png"
	} as OptionItem,
	{
		title: Langs.Chinese,
		icon: "images/cn.png"
	} as OptionItem
]

export const StyleModeOptions: OptionItem[] = [
	// {
	// 	title: StyleModes.Light,
	// 	icon: "images/light.png"
	// },
	{
		title: StyleModes.Dark,
		icon: "images/dark.png"
	}
];

export const Troves: OptionItem[] = [
	{
		title: IOTX.symbol,
		icon: IOTX.logo
	},
	{
		title: DAI.symbol,
		icon: DAI.logo,
		disabled: true
	},
	{
		title: USDC.symbol,
		icon: USDC.logo,
		disabled: true
	}
];

export const TroveOptions: OptionItem[] = [
	{
		key: "closeVault"
	}
];

export const globalContants = {
	APP_LANG: "appLang",
	COINS: { WEN, IOTX, DAI, USDC } as Record<string, Coin>,
	USD: "USD",
	DEFAULT_NETWORK_ID: 4689,
	default_NETWORK_RPC: "https://babel-api.mainnet.iotex.io",
	ADDRESS_PLACEHOLDER: "0x43D46D96157f497070BfD0725C34C4A9d1013292",
	ADDRESS_0: "0x0000000000000000000000000000000000000000",
	LIQUIDATION_AT: 0.8,
	BIG_NUMBER_0: BigNumber(0),
	BIG_NUMBER_1: BigNumber(1),
	TERMS_SHOWED: "termsShowed",
	IOTX_DECIMALS: Math.pow(10, IOTX.decimals || 18),
	WEN_DECIMALS: Math.pow(10, WEN.decimals || 18),
	MONTH_SECONDS: 2592000,
	WEEK_SECONDS: 604800,
	HOST: "app.magma.finance/?ref=",
	REF_KEY: "ref@",
	DECIMALS_2: 2
};