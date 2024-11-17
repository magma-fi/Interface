/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { DappContract } from "./DappContract";
import appConfig from "../appConfig.json";
import { Coin, JsonObject, callRequest } from "./types";
import { IOTX, WEN } from "./globalContants";
import { BigNumber } from "bignumber.js";
import multicallAbi from "../abis/multicall.json";
import troveManagerAbi from "../abis/TroveManager.json";
import priceFeedAbi from "../abis/PriceFeed.json";
import lusdTokenAbi from "../abis/LUSDToken.json";
import stabilityPoolAbi from "../abis/StabilityPool.json";
import { JsonRpcSigner } from "@ethersproject/providers";
import { providers } from 'ethers';
import { multicaller } from "./multicaller";
import { formatAssetAmount } from "../utils";

export const magmaV2: {
	magmaData: Record<string, any>;
	tokens: Record<string, Coin>;
	_magmaCfg: JsonObject;
	_multicallContract?: DappContract;
	_lusdTokenContract?: DappContract;
	_troveManagerContract?: DappContract;
	_priceFeedContract?: DappContract;
	_stabilityPoolContract?: DappContract;
	_signer?: providers.JsonRpcSigner;
	init: (chainId: number, signer: JsonRpcSigner, account?: string) => void;
	getMagmaData: () => Promise<Record<string, any> | undefined>;
	calculateTVL: () => number;
	calculateTotalWENStaked: () => number;
	_readyContracts: () => void;
	_getMagmaDataStep1: () => Promise<void>;
	_loadingData: boolean;
} = {
	_loadingData: false,
	_magmaCfg: {},
	tokens: {},
	magmaData: {},

	init: function (chainId: number, signer: providers.JsonRpcSigner) {
		this._signer = signer;
		this._magmaCfg = (appConfig.magmaV2 as JsonObject)[String(chainId)];

		this._readyContracts();
	},

	getMagmaData: async function (): Promise<Record<string, any> | undefined> {
		if (this._loadingData) return;

		this._loadingData = true;
		await this._getMagmaDataStep1();
		this._loadingData = false;

		return this.magmaData;
	},

	_readyContracts: function (): void {
		if (this._magmaCfg.multicaller) {
			this._multicallContract = new DappContract(this._magmaCfg.multicaller, multicallAbi, this._signer);
			multicaller.init(this._multicallContract);
		}

		if (this._magmaCfg.priceFeed) {
			this._priceFeedContract = new DappContract(this._magmaCfg.priceFeed, priceFeedAbi, this._signer);
		}

		if (this._magmaCfg.lusdToken) {
			this._lusdTokenContract = new DappContract(this._magmaCfg.lusdToken, lusdTokenAbi, this._signer);
		}

		if (this._magmaCfg.troveManager) {
			this._troveManagerContract = new DappContract(this._magmaCfg.troveManager, troveManagerAbi, this._signer);
		}

		if (this._magmaCfg.stabilityPool) {
			this._stabilityPoolContract = new DappContract(this._magmaCfg.stabilityPool, stabilityPoolAbi, this._signer);
		}
	},

	_getMagmaDataStep1: async function (): Promise<void> {
		multicaller.addCall({
			contractAddress: this._lusdTokenContract?.address,
			call: this._lusdTokenContract?.dappFunctions.totalSupply.encode(),
			parseFunc: args => {
				this.magmaData.wenTotalSupply = BigNumber(args as string);
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._priceFeedContract?.address,
			call: this._priceFeedContract?.dappFunctions.fetchPrice.encode(),
			parseFunc: args => {
				this.magmaData.price = BigNumber(args as string).shiftedBy(-18).toNumber();
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.getEntireSystemColl.encode(),
			parseFunc: args => {
				this.magmaData.entireSystemColl = BigNumber(args as string);
				this.magmaData.TVL = this.magmaData.entireSystemColl;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.getTotalLUSDDeposits.encode(),
			parseFunc: args => {
				// const res: any = this._stabilityPoolContract.interface.decodeFunctionResult("getTotalLUSDDeposits", args);
				this.magmaData.lusdInStabilityPool = BigNumber(args as string);
			}
		} as callRequest);

		await multicaller.batchingCall();
	},

	calculateTVL: function (): number {
		const amountDecimals = formatAssetAmount(this.magmaData.TVL, IOTX.decimals);
		const price = this.magmaData.price;
		return amountDecimals * price;
	},

	calculateTotalWENStaked: function (): number {
		return formatAssetAmount(this.magmaData.lusdInStabilityPool, WEN.decimals);
	}
};