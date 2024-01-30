import { DappContract } from "./DappContract.";
import appConfig from "../appConfig.json";
import { JsonObject, Vaultish, callRequest } from "./types";
import MultiTroveGetterAbi from "../abis/MultiTroveGetter.json";
import { Vault } from "./Vault";
import { graphqlAsker } from "./graphqlAsker";
import { IOTX, globalContants } from "./globalContants";
import { BigNumber } from "bignumber.js";
import multicallAbi from "../abis/multicall.json";
import troveManagerAbi from "../abis/TroveManager.json";
import priceFeedAbi from "../abis/PriceFeed.json";
import { JsonRpcSigner } from "@ethersproject/providers";
import { providers } from 'ethers';
import { multicaller } from "./multicaller";

export const magma: {
	_currentChainId: number;
	_magmaCfg: JsonObject;
	_multicallContract?: DappContract;
	_troveManagerContract?: DappContract;
	_priceFeedContract?: DappContract;
	_signer?: providers.JsonRpcSigner;
	magmaData: Record<string, any>;
	vaults: Vault[];
	init: (chainId: number, signer: JsonRpcSigner) => void;
	getVaults: (forceReload: boolean, doneCallback?: (vs: Vault[]) => void) => void;
	getMagmaData: () => void;
	_readyContracts: () => void;
	_getVaults: () => void;
	_getMagmaDataStep1: () => Promise<void>;
	_getMagmaDataStep2: () => Promise<void>;
	_loadingData: boolean;
} = {
	_loadingData: false,
	_currentChainId: globalContants.DEFAULT_NETWORK_ID,
	_magmaCfg: {},
	vaults: [],
	magmaData: {},

	init: function (chainId: number, signer: providers.JsonRpcSigner) {
		this._signer = signer;
		this._currentChainId = chainId;
		this._magmaCfg = (appConfig.magma as JsonObject)[String(chainId)];

		this._readyContracts();
	},

	getMagmaData: async function () {
		if (this._loadingData) return;

		this._loadingData = true;
		await this._getMagmaDataStep1();
		await this._getMagmaDataStep2();
		this._loadingData = false;

		return this.magmaData;
	},

	getVaults: function (forceReload = false, doneCallback) {
		if (this.vaults.length === 0 || forceReload) {
			const query = graphqlAsker.requestVaults();
			graphqlAsker.ask(this._currentChainId, query, (data: any) => {
				if (data?.troves) {
					data.troves.forEach((vault: JsonObject) => {
						this.vaults.push(new Vault(
							{
								id: vault.id,
								status: vault.status,
								collateral: BigNumber(vault.rawCollateral),
								debt: BigNumber(vault.rawDebt),
								collateralRatioSortKey: vault.collateralRatioSortKey
							} as Vaultish,
							IOTX
						));
					});
				}

				return doneCallback && doneCallback(this.vaults);
			});
		} else {
			return doneCallback && doneCallback(this.vaults);
		}
	},

	_getVaults: function () {
		// // _getVaults: function (params: TroveListingParams, overrides?: EthersCallOverrides): Promise<UserTrove[]> {
		// // const { multiTroveGetter } = _getContracts(this.connection);
		// const multiTroveGetter = new DappContract(this._magmaCfg.multiTroveGetter, MultiTroveGetterAbi);
		// // expectPositiveInt(params, "first");
		// // expectPositiveInt(params, "startingAt");
		// // if (!validSortingOptions.includes(params.sortedBy)) {
		// //   throw new Error(
		// //     `sortedBy must be one of: ${validSortingOptions.map(x => `"${x}"`).join(", ")}`
		// //   );
		// // }
		// // const [totalRedistributed, backendTroves] = await Promise.all([
		// //   params.beforeRedistribution ? undefined : this.getTotalRedistributed({ ...overrides }),
		// //   multiTroveGetter.getMultipleSortedTroves(
		// //     params.sortedBy === "descendingCollateralRatio"
		// //       ? params.startingAt ?? 0
		// //       : -((params.startingAt ?? 0) + 1),
		// //     params.first,
		// //     { ...overrides }
		// //   )
		// // ]);
		// // const troves = mapBackendTroves(backendTroves);
		// // if (totalRedistributed) {
		// //   return troves.map(trove => trove.applyRedistribution(totalRedistributed));
		// // } else {
		// //   return troves;
		// // }
	},

	_readyContracts: function (): void {
		if (this._magmaCfg.troveManager) {
			this._troveManagerContract = new DappContract(this._magmaCfg.troveManager, troveManagerAbi, this._signer);
		}

		if (this._magmaCfg.priceFeed) {
			this._priceFeedContract = new DappContract(this._magmaCfg.priceFeed, priceFeedAbi, this._signer);
		}

		if (this._magmaCfg.multicaller) {
			this._multicallContract = new DappContract(this._magmaCfg.multicaller, multicallAbi, this._signer);
			multicaller.init(this._multicallContract);
		}
	},

	_getMagmaDataStep1: async function (): Promise<void> {
		multicaller.addCall({
			contractAddress: this._priceFeedContract?.address,
			call: this._priceFeedContract?.dappFunctions.lastGoodPrice.encode(),
			parseFunc: (args: string[] | string) => {
				this.magmaData["price"] = BigNumber(args as string).shiftedBy(-18).toNumber();
			}
		} as callRequest);

		await multicaller.batchingCall();
	},

	_getMagmaDataStep2: async function (): Promise<void> {
		multicaller.addCall({
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.checkRecoveryMode.encode(BigNumber(this.magmaData.price).shiftedBy(18).toFixed(0)),
			parseFunc: (args: string[]) => {
				this.magmaData["recoveryMode"] = Boolean(BigNumber(args).toNumber());
			}
		} as callRequest);

		await multicaller.batchingCall();
	}
};