import { Coin, OptionItem } from "./types";

export enum Langs {
	English = "english",
	Chinese = "中文"
}

export enum StyleModes {
	Light = "light",
	Dark = "dark"
}

export const WEN: Coin = {
	symbol: "WEN",
	logo: "images/wen.png"
}

export const IOTX: Coin = {
	symbol: "IOTX",
	logo: "images/iotx.png"
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
		icon: DAI.logo
	},
	{
		title: USDC.symbol,
		icon: USDC.logo
	}
];

export const TroveOptions: OptionItem[] = [
	{
		key: "close"
	}
];

export const globalContants = {
	APP_LANG: "appLang",
	COINS: { WEN, IOTX, DAI, USDC } as Record<string, Coin>,
	USD: "USD",
	DEFAULT_NETWORK_ID: 4690,
	default_NETWORK_RPC: "https://babel-api.testnet.iotex.io",
	ADDRESS_PLACEHOLDER: "0x43D46D96157f497070BfD0725C34C4A9d1013292",
	LIQUIDATION_AT: 0.8
};