/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { DappContract } from "./DappContract";
import appConfig from "../appConfig.json";
import { ApproxHintObject, Coin, JsonObject, StabilityDeposit, VaultStatus, Vaultish, callRequest } from "./types";
import { Vault } from "./Vault";
import { graphqlAsker } from "./graphqlAsker";
import { IOTX, WEN, globalContants, uniIOTX } from "./globalContants";
import { BigNumber } from "bignumber.js";
import multicallAbi from "../abis/multicall.json";
import troveManagerAbi from "../abis/TroveManager.json";
import priceFeedAbi from "../abis/PriceFeed.json";
import collTokenPriceFeedAbi from "../abis/CollTokenPriceFeed.json";
import lusdTokenAbi from "../abis/LUSDToken.json";
import sysConfigAbi from "../abis/SysConfig.json";
import borrowerOperationsAbi from "../abis/BorrowerOperations.json";
import sortedTrovesAbi from "../abis/SortedTroves.json";
import hintHelpersAbi from "../abis/HintHelpers.json";
import stabilityPoolAbi from "../abis/StabilityPool.json";
import collSurplusPoolABI from "../abis/CollSurplusPool.json";
import { JsonRpcSigner } from "@ethersproject/providers";
import { providers } from 'ethers';
import { multicaller } from "./multicaller";
import { formatAssetAmount, generateTrials, randomInteger } from "../utils";
import { zeroAddress } from "viem";
import { erc20ABI } from "wagmi";

export const magma: {
	borrowerOperationsContract?: DappContract;
	magmaData: Record<string, any>;
	vaults: Record<string, Vault[]>;
	tokens: Record<string, Coin>;
	_account: string;
	_currentChainId: number;
	_magmaCfg: JsonObject;
	_tokensAsKey: string[];
	_tokenEntriesAsKey: any[];
	_multicallContract?: DappContract;
	_lusdTokenContract?: DappContract;
	_sysConfigContract?: DappContract;
	_sortedTrovesContract: Record<string, DappContract>;
	_hintHelpersContract: Record<string, DappContract>;
	_troveManagerContract: Record<string, DappContract>;
	_tokenContract: Record<string, DappContract>;
	tokenContract: Record<string, DappContract>;
	_priceFeedContract?: DappContract | Record<string, DappContract>;
	_stabilityPoolContract: Record<string, DappContract>;
	_collSurplusPoolContract: Record<string, DappContract>;
	_signer?: providers.JsonRpcSigner;
	_borrowingRate: Record<string, number>;
	_wenGasCompensation: BigNumber;
	init: (chainId: number, signer: JsonRpcSigner, account?: string) => void;
	getCollSurplusPoolContract: (token: string) => DappContract;
	getVaults: (forceReload: boolean, fromIndex: number, doneCallback?: (vs: Vault[]) => void, collateralToken?: Coin) => void;
	getMagmaData: () => Promise<Record<string, any> | undefined>;
	getVaultByOwner: (owner: string) => Promise<Vault | undefined>;
	findHintsForNominalCollateralRatio: (nominalCollateralRatio: number, ownAddress?: string, market?: Coin) => Promise<[string, string]>;
	wouldBeRecoveryMode: (collateral: BigNumber, debt: BigNumber, collateralPrice: number, loanPrice: number, collateralToken: Coin, loanToken: Coin) => boolean;
	computeFee: () => number;
	openVault: (vault: Vault, maxFeePercentage: number, debtChange: BigNumber, deposit: BigNumber, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	closeVault: (token: Coin, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	stake: (token: Coin, amount: BigNumber, frontendTag: string, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	unstake: (token: Coin, amount: BigNumber, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	swap: (wenAmount: BigNumber, collateralPrice: number, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void, market?: Coin) => void;
	getRedemptionFeeWithDecay: (amount: BigNumber, market: Coin) => Promise<BigNumber>;
	getRedemptionRate: (market: Coin) => Promise<BigNumber>;
	calculateRedemptionFee: (amount: BigNumber, rate: BigNumber) => BigNumber | undefined;
	getTotalCollateralRatio: (collateralToken?: Coin) => number;
	liquidate: (borrower: string, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void, token?: string) => void;
	calculateTVL: () => number;
	calculateTVLOfAllVault: (vaults: any, prices: any) => number;
	calculateTotalLoanOfAllVault: (vaults: any) => number;
	calculateTotalStakedOfAllVault: () => number;
	calculateTotalWENStaked: () => number;
	_readyTokens: () => void;
	_readyContracts: () => void;
	_getMagmaDataStep1: () => Promise<void>;
	_getMagmaDataStep2: () => Promise<void>;
	_loadingData: boolean;
} = {
	_account: globalContants.ADDRESS_PLACEHOLDER,
	_loadingData: false,
	_currentChainId: globalContants.DEFAULT_NETWORK_ID,
	_magmaCfg: {},
	_tokensAsKey: [],
	_tokenEntriesAsKey: [],
	vaults: {
		[IOTX.symbol]: [],
		[uniIOTX.symbol]: []
	},
	tokens: {},
	magmaData: {
		price: {},
		vaultsCount: {},
		borrowingRateWithDecay: {},
		stabilityDeposit: {},
		lusdInStabilityPool: {},
		entireSystemColl: {},
		TVL: {},
		entireSystemDebt: {},
		recoveryMode: {},
		balance: {},
		collTokenMCR: {},
		collTokenCCR: {}
	},
	_borrowingRate: {},
	_wenGasCompensation: globalContants.BIG_NUMBER_0,
	_troveManagerContract: {},
	_sortedTrovesContract: {},
	_hintHelpersContract: {},
	_stabilityPoolContract: {},

	_collSurplusPoolContract: {},

	_tokenContract: {},
	get tokenContract() {
		return this._tokenContract;
	},

	init: function (chainId: number, signer: providers.JsonRpcSigner, account?: string) {
		this._signer = signer;
		this._currentChainId = chainId;
		this._magmaCfg = (appConfig.magma as JsonObject)[String(chainId)];
		this._tokensAsKey = Object.keys(this._magmaCfg.tokens);
		this._tokenEntriesAsKey = Object.entries(this._magmaCfg.tokens);

		if (account) this._account = account;

		this._readyTokens();
		this._readyContracts();
	},

	getCollSurplusPoolContract(token: string): DappContract {
		return this._collSurplusPoolContract[token];
	},

	getMagmaData: async function (): Promise<Record<string, any> | undefined> {
		if (this._loadingData) return;

		this._loadingData = true;
		await this._getMagmaDataStep1();
		await this._getMagmaDataStep2();
		this._loadingData = false;

		return this.magmaData;
	},

	getVaults: function (forceReload = false, fromIndex = 0, doneCallback, collateralToken = IOTX) {
		if (this.vaults[collateralToken.symbol].length === 0 || forceReload) {
			const query = graphqlAsker.requestVaults(fromIndex);

			graphqlAsker.ask(
				this._currentChainId,
				query,
				(data: any) => {
					if (data?.troves) {
						data.troves.forEach((vault: JsonObject) => {
							this.vaults[collateralToken.symbol].push(
								new Vault({
									id: vault.id,
									status: vault.status as VaultStatus,
									collateral: BigNumber(vault.rawCollateral),
									debt: BigNumber(vault.rawDebt),
									collateralRatioSortKey: vault.collateralRatioSortKey
								} as Vaultish,
									collateralToken,
									this._wenGasCompensation,
									this._borrowingRate[collateralToken.symbol]
								));
						});
					}

					return doneCallback && doneCallback(this.vaults[collateralToken.symbol]);
				},
				undefined,
				collateralToken
			);
		} else {
			return doneCallback && doneCallback(this.vaults[collateralToken.symbol]);
		}
	},

	getVaultByOwner: async function (owner: string): Promise<Vault | undefined> {
		const obj: any = {};
		for (let i = 0; i < this._tokensAsKey.length; i++) {
			const key = this._tokensAsKey[i];

			const res: any = await this._troveManagerContract[key]?.dappFunctions.Troves.call(owner);
			obj[key] = new Vault(
				{
					id: owner,
					debt: BigNumber(res.debt._hex),
					collateral: BigNumber(res.coll._hex),
					stake: BigNumber(res.stake._hex),
					status: res.status as VaultStatus,
					arrayIndex: BigNumber(res.arrayIndex._hex)
				} as Vaultish,
				this.tokens[key],
				this._wenGasCompensation,
				this._borrowingRate[key],
				this._currentChainId
			);
		}

		return obj;
	},

	computeFee: function (): number {
		// return this.magmaData.recoveryMode ? 0 : Decimal.min(MINIMUM_BORROWING_RATE.add(this.baseRate(when)), MAXIMUM_BORROWING_RATE);
		return 0;
	},

	openVault: async function (vault: Vault, maxFeePercentage: number, debtChange: BigNumber, deposit: BigNumber, onWait, onFail, onDone) {
		const hints = await this.findHintsForNominalCollateralRatio(vault.nominalCollateralRatio(), vault.id);
		const amount = deposit.toFixed();
		if (vault.collateralToken.address && vault.collateralToken.address !== zeroAddress) {
			this._tokenContract[vault.collateralToken.symbol].dappFunctions.approve.run(
				undefined,
				onFail,
				() => {
					this.borrowerOperationsContract?.dappFunctions["openTrove(address,uint256,uint256,uint256,address,address)"].run(
						onWait,
						onFail,
						onDone,
						undefined,
						vault.collateralToken.address,
						amount,
						BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
						debtChange.toFixed(),
						hints[0],
						hints[1]
					);
				},
				undefined,
				this.borrowerOperationsContract?.address,
				amount
			);
		} else {
			this.borrowerOperationsContract?.dappFunctions["openTrove(uint256,uint256,address,address)"].run(
				onWait,
				onFail,
				onDone,
				{ value: amount },
				BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
				debtChange.toFixed(),
				hints[0],
				hints[1]
			);
		}
	},

	_readyContracts: function (): void {
		if (this._magmaCfg.multicaller) {
			this._multicallContract = new DappContract(this._magmaCfg.multicaller, multicallAbi, this._signer);
			multicaller.init(this._multicallContract);
		}

		if (this._magmaCfg.priceFeed) {
			this._priceFeedContract = new DappContract(this._magmaCfg.priceFeed, priceFeedAbi, this._signer);
		} else {
			this._priceFeedContract = {};
		}

		if (this._magmaCfg.lusdToken) {
			this._lusdTokenContract = new DappContract(this._magmaCfg.lusdToken, lusdTokenAbi, this._signer);
		}

		if (this._magmaCfg.sysConfig) {
			this._sysConfigContract = new DappContract(this._magmaCfg.sysConfig, sysConfigAbi, this._signer);
		}

		if (this._magmaCfg.borrowerOperations) {
			this.borrowerOperationsContract = new DappContract(this._magmaCfg.borrowerOperations, borrowerOperationsAbi, this._signer);
		}

		this._tokenEntriesAsKey.forEach((token: any) => {
			const key = token[0];
			const tokenCfg = token[1];

			if (tokenCfg.address !== zeroAddress) {
				this._tokenContract[key] = new DappContract(tokenCfg.address, erc20ABI, this._signer);
			}

			if (tokenCfg.troveManager) {
				this._troveManagerContract[key] = new DappContract(tokenCfg.troveManager, troveManagerAbi, this._signer);
			}

			if (tokenCfg.sortedTroves) {
				this._sortedTrovesContract[key] = new DappContract(tokenCfg.sortedTroves, sortedTrovesAbi, this._signer);
			}

			if (tokenCfg.hintHelpers) {
				this._hintHelpersContract[key] = new DappContract(tokenCfg.hintHelpers, hintHelpersAbi, this._signer);
			}

			if (tokenCfg.stabilityPool) {
				this._stabilityPoolContract[key] = new DappContract(tokenCfg.stabilityPool, stabilityPoolAbi, this._signer);
			}

			if (tokenCfg.collSurplusPool) {
				this._collSurplusPoolContract[key] = new DappContract(tokenCfg.collSurplusPool, collSurplusPoolABI, this._signer);
			}

			if (tokenCfg.priceFeed) {
				let abi;
				if (tokenCfg.address === zeroAddress) {
					abi = priceFeedAbi;
				} else {
					abi = collTokenPriceFeedAbi;
				}
				(this._priceFeedContract as Record<string, DappContract>)[key] = new DappContract(tokenCfg.priceFeed, abi, this._signer);
			}
		});
	},

	_getMagmaDataStep1: async function (): Promise<void> {
		const getItsPriceFeedContract = (key: string): DappContract => {
			let itsPriceFeedContract: DappContract;

			if (this._priceFeedContract instanceof DappContract && !this._priceFeedContract[key]) {
				itsPriceFeedContract = this._priceFeedContract;
			} else {
				itsPriceFeedContract = this._priceFeedContract?.[key];
			}

			return itsPriceFeedContract;
		};

		multicaller.addCall({
			contractAddress: this._lusdTokenContract?.address,
			call: this._lusdTokenContract?.dappFunctions.balanceOf.encode(this._account),
			parseFunc: args => {
				this.magmaData.lusdBalance = BigNumber(args as string);
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._lusdTokenContract?.address,
			call: this._lusdTokenContract?.dappFunctions.totalSupply.encode(),
			parseFunc: args => {
				this.magmaData.wenTotalSupply = BigNumber(args as string);
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this.borrowerOperationsContract?.address,
			call: this.borrowerOperationsContract?.dappFunctions.MIN_NET_DEBT.encode(),
			parseFunc: args => {
				this.magmaData.MIN_NET_DEBT = BigNumber(args as string);
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this.borrowerOperationsContract?.address,
			call: this.borrowerOperationsContract?.dappFunctions.LUSD_GAS_COMPENSATION.encode(),
			parseFunc: args => {
				this.magmaData.LUSD_GAS_COMPENSATION = BigNumber(args as string);
				this._wenGasCompensation = this.magmaData.LUSD_GAS_COMPENSATION;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this.borrowerOperationsContract?.address,
			call: this.borrowerOperationsContract?.dappFunctions.MCR.encode(),
			parseFunc: args => {
				this.magmaData.MCR = BigNumber(args as string).shiftedBy(-18).toNumber();
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this.borrowerOperationsContract?.address,
			call: this.borrowerOperationsContract?.dappFunctions.CCR.encode(),
			parseFunc: args => {
				this.magmaData.CCR = BigNumber(args as string).shiftedBy(-18).toNumber();
			}
		} as callRequest);

		this._tokenEntriesAsKey.forEach(items => {
			const key = items[0];
			const tokenCfg: any = items[1];
			const theTroveManagerContract = this._troveManagerContract[key];
			const theStabilityPoolContract = this._stabilityPoolContract[key];
			const itsPriceFeedContract = getItsPriceFeedContract(key);

			if (tokenCfg.address === zeroAddress) {
				multicaller.addCall({
					contractAddress: itsPriceFeedContract?.address,
					call: itsPriceFeedContract?.dappFunctions.fetchPrice.encode(),
					parseFunc: args => {
						this.magmaData.price[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
					}
				} as callRequest);

				multicaller.addCall({
					contractAddress: theTroveManagerContract?.address,
					call: theTroveManagerContract?.dappFunctions.getEntireSystemColl.encode(),
					parseFunc: args => {
						this.magmaData.entireSystemColl[key] = BigNumber(args as string);
						this.magmaData.TVL[key] = this.magmaData.entireSystemColl[key];
					}
				} as callRequest);

				multicaller.addCall({
					contractAddress: theTroveManagerContract?.address,
					call: theTroveManagerContract?.dappFunctions.getEntireSystemDebt.encode(),
					parseFunc: args => {
						this.magmaData.entireSystemDebt[key] = BigNumber(args as string);
					}
				} as callRequest);
			} else {
				if (this._tokenContract[key]) {
					multicaller.addCall({
						contractAddress: this._tokenContract[key].address,
						call: this._tokenContract[key]?.dappFunctions.balanceOf.encode(this._account),
						parseFunc: args => {
							this.magmaData.balance[key] = BigNumber(args as string);
						}
					} as callRequest);
				}

				if (tokenCfg.priceFeed) {
					multicaller.addCall({
						contractAddress: itsPriceFeedContract.address,
						call: itsPriceFeedContract.dappFunctions.fetchPrice.encode(tokenCfg.address),
						parseFunc: args => {
							this.magmaData.price[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
						}
					} as callRequest);
				} else {
					multicaller.addCall({
						contractAddress: this._sysConfigContract?.address,
						call: this._sysConfigContract?.dappFunctions.fetchPrice.encode(tokenCfg.address),
						parseFunc: args => {
							this.magmaData.price[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
						}
					} as callRequest);
				}

				multicaller.addCall({
					contractAddress: this._sysConfigContract?.address,
					call: this._sysConfigContract?.dappFunctions.getEntireSystemColl.encode(tokenCfg.address),
					parseFunc: args => {
						this.magmaData.entireSystemColl[key] = BigNumber(args as string);
						this.magmaData.TVL[key] = this.magmaData.entireSystemColl[key];
					}
				} as callRequest);

				multicaller.addCall({
					contractAddress: this._sysConfigContract?.address,
					call: this._sysConfigContract?.dappFunctions.getEntireSystemDebt.encode(tokenCfg.address),
					parseFunc: args => {
						this.magmaData.entireSystemDebt[key] = BigNumber(args as string);
					}
				} as callRequest);
			}

			multicaller.addCall({
				contractAddress: theTroveManagerContract?.address,
				call: theTroveManagerContract?.dappFunctions.getTroveOwnersCount.encode(),
				parseFunc: args => {
					this.magmaData.vaultsCount[key] = BigNumber(args as string).toNumber();
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theTroveManagerContract?.address,
				call: theTroveManagerContract?.dappFunctions.getBorrowingRateWithDecay.encode(),
				parseFunc: args => {
					this.magmaData.borrowingRateWithDecay[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
					this._borrowingRate[key] = this.magmaData.borrowingRateWithDecay;
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theStabilityPoolContract?.address,
				call: theStabilityPoolContract?.dappFunctions.getDepositorETHGain.encode(this._account),
				parseFunc: args => {
					this.magmaData.stabilityDeposit[key] = {
						...this.magmaData.stabilityDeposit[key],
						collateralGain: BigNumber(args as string)
					} as StabilityDeposit;
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theStabilityPoolContract?.address,
				call: theStabilityPoolContract?.dappFunctions.getCompoundedLUSDDeposit.encode(this._account),
				parseFunc: args => {
					this.magmaData.stabilityDeposit[key] = {
						...this.magmaData.stabilityDeposit[key],
						currentLUSD: BigNumber(args as string)
					} as StabilityDeposit;
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theStabilityPoolContract?.address,
				call: theStabilityPoolContract?.dappFunctions.getDepositorLQTYGain.encode(this._account),
				parseFunc: args => {
					this.magmaData.stabilityDeposit[key] = {
						...this.magmaData.stabilityDeposit[key],
						lqtyReward: BigNumber(args as string)
					} as StabilityDeposit;
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theStabilityPoolContract?.address,
				call: theStabilityPoolContract?.dappFunctions.deposits.encode(this._account),
				parseFunc: args => {
					const res: any = theStabilityPoolContract?.interface.decodeFunctionResult("deposits", args);
					this.magmaData.stabilityDeposit[key] = {
						...this.magmaData.stabilityDeposit[key],
						initialValue: BigNumber(res[0] as string),
						frontEndTag: res[1]
					} as StabilityDeposit;
				}
			} as callRequest);

			multicaller.addCall({
				contractAddress: theStabilityPoolContract?.address,
				call: theStabilityPoolContract?.dappFunctions.getTotalLUSDDeposits.encode(),
				parseFunc: args => {
					const res: any = theStabilityPoolContract?.interface.decodeFunctionResult("getTotalLUSDDeposits", args);
					this.magmaData.lusdInStabilityPool[key] = BigNumber(res[0]._hex);
				}
			} as callRequest);
		});

		await multicaller.batchingCall();
	},

	_getMagmaDataStep2: async function (): Promise<void> {
		this._tokenEntriesAsKey.forEach(items => {
			const key = items[0];
			const tokenCfg: any = items[1];
			const theTroveManagerContract = this._troveManagerContract[key];

			multicaller.addCall({
				contractAddress: theTroveManagerContract?.address,
				call: theTroveManagerContract?.dappFunctions.checkRecoveryMode.encode(BigNumber(this.magmaData.price[key]).shiftedBy(18).toFixed(0)),
				parseFunc: args => {
					this.magmaData.recoveryMode[key] = Boolean(BigNumber(args as string).toNumber());
				}
			} as callRequest);

			if (tokenCfg.address === zeroAddress) {
				this.magmaData.collTokenCCR[key] = this.magmaData.CCR;
			} else {
				multicaller.addCall({
					contractAddress: this._sysConfigContract?.address,
					call: this._sysConfigContract?.dappFunctions.getCollTokenCCR.encode(tokenCfg.address, BigNumber(this.magmaData.CCR).shiftedBy(18).toFixed()),
					parseFunc: args => {
						this.magmaData.collTokenCCR[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
					}
				} as callRequest);
			}

			if (tokenCfg.address === zeroAddress) {
				this.magmaData.collTokenMCR[key] = this.magmaData.MCR;
			} else {
				multicaller.addCall({
					contractAddress: this._sysConfigContract?.address,
					call: this._sysConfigContract?.dappFunctions.getCollTokenMCR.encode(tokenCfg.address, BigNumber(this.magmaData.MCR).shiftedBy(18).toFixed()),
					parseFunc: args => {
						this.magmaData.collTokenMCR[key] = BigNumber(args as string).shiftedBy(-18).toNumber();
					}
				} as callRequest);
			}
		});

		await multicaller.batchingCall();
	},

	findHintsForNominalCollateralRatio: async function (nominalCollateralRatio: number, ownAddress?: string, market: Coin = IOTX): Promise<[string, string]> {
		const numberOfTroves = this.magmaData.vaultsCount[market.symbol];

		if (!numberOfTroves) {
			return [globalContants.ADDRESS_0, globalContants.ADDRESS_0];
		}

		if (!Number.isFinite(nominalCollateralRatio)) {
			const res = await this._sortedTrovesContract[market.symbol]?.dappFunctions.getFirst.call();
			return [globalContants.ADDRESS_0, res as unknown as string];
		}

		const nominalCollateralRatioNumber = BigNumber(nominalCollateralRatio).shiftedBy(18).toFixed();
		const totalNumberOfTrials = Math.ceil(10 * Math.sqrt(numberOfTroves));
		const [firstTrials, ...restOfTrials] = generateTrials(totalNumberOfTrials, this._currentChainId);

		const collectApproxHint = async (
			argObject: ApproxHintObject,
			numberOfTrials: number
		) => {
			const res: any = await this._hintHelpersContract[market.symbol]?.dappFunctions.getApproxHint.call(
				nominalCollateralRatioNumber,
				numberOfTrials,
				argObject.latestRandomSeed.toFixed()
			);

			const resultObject: ApproxHintObject = {
				latestRandomSeed: globalContants.BIG_NUMBER_0,
				results: []
			};

			if (res) {
				resultObject.latestRandomSeed = BigNumber(res.latestRandomSeed._hex);
				resultObject.results.push({
					hintAddress: res.hintAddress,
					diff: BigNumber(res.diff._hex)
				});
			}

			return resultObject;
		};

		const { results } = await restOfTrials.reduce(
			(p, numberOfTrials) => p.then(state => collectApproxHint(state, numberOfTrials)),
			collectApproxHint({ latestRandomSeed: BigNumber(randomInteger()), results: [] }, firstTrials)
		);

		const { hintAddress } = results.reduce((a, b) => (a.diff.lt(b.diff) ? a : b));

		const positionResult: any = await this._sortedTrovesContract[market.symbol]?.dappFunctions.findInsertPosition.call(
			nominalCollateralRatioNumber,
			hintAddress,
			hintAddress
		);
		let prev = positionResult[0];
		let next = positionResult[1];

		if (ownAddress) {
			// In the case of reinsertion, the address of the Trove being reinserted is not a usable hint,
			// because it is deleted from the list before the reinsertion.
			// "Jump over" the Trove to get the proper hint.
			if (prev === ownAddress) {
				prev = await this._sortedTrovesContract[market.symbol]?.dappFunctions.getPrev.call(prev);
			} else if (next === ownAddress) {
				next = await this._sortedTrovesContract[market.symbol]?.dappFunctions.getNext.call(next);
			}
		}

		// Don't use `address(0)` as hint as it can result in huge gas cost.
		// (See https://github.com/liquity/dev/issues/600).
		if (prev === globalContants.ADDRESS_0) {
			prev = next;
		} else if (next === globalContants.ADDRESS_0) {
			next = prev;
		}

		return [prev, next];
	},

	wouldBeRecoveryMode: function (collateral: BigNumber, debt: BigNumber, collateralPrice: number, loanPrice = 1, collateralToken: Coin, loanToken = WEN): boolean {
		if (!this.magmaData?.entireSystemColl[collateralToken.symbol] || !this.magmaData?.entireSystemDebt[collateralToken.symbol] || !this.magmaData?.CCR) throw new Error("magmaData.* is null");

		if (debt.eq(0)) {
			return false;
		} else {
			return collateral.shiftedBy(-collateralToken.decimals)
				.multipliedBy(collateralPrice)
				.dividedBy(
					debt.shiftedBy(-loanToken.decimals)
						.multipliedBy(loanPrice)
				).lt(this.magmaData.CCR);
		}
	},

	closeVault: function (token = IOTX, onWait, onFail, onDone): void {
		if (token.symbol === IOTX.symbol) {
			this.borrowerOperationsContract?.dappFunctions["closeTrove()"].run(onWait, onFail, onDone, { from: this._account });
		} else {
			this.borrowerOperationsContract?.dappFunctions["closeTrove(address)"].run(onWait, onFail, onDone, { from: this._account }, token.address);
		}
	},

	stake: function (token = IOTX, amount, frontendTag, onWait, onFail, onDone): void {
		const amt = amount.toFixed();
		if (!token.address || token.address === zeroAddress) {
			this._stabilityPoolContract[token.symbol]?.dappFunctions.provideToSP.run(
				onWait,
				onFail,
				onDone,
				{ from: this._account },
				amt,
				frontendTag
			);
		} else {
			this._lusdTokenContract?.dappFunctions.approve.run(
				undefined,
				onFail,
				() => {
					this._stabilityPoolContract[token.symbol]?.dappFunctions.provideToSP.run(
						onWait,
						onFail,
						onDone,
						{ from: this._account },
						amt,
						frontendTag
					);
				},
				undefined,
				this._stabilityPoolContract[token.symbol]?.address,
				amt
			);
		}
	},

	unstake: function (token = IOTX, amount, onWait, onFail, onDone): void {
		const amt = amount.toFixed();
		const func = () => {
			this._stabilityPoolContract[token.symbol]?.dappFunctions.withdrawFromSP.run(
				onWait,
				onFail,
				onDone,
				{ from: this._account },
				amt
			);
		};
		func();

		// if (!token.address || token.address === zeroAddress) {
		// 	func()
		// } else {
		// 	this._lusdTokenContract?.dappFunctions.approve.run(
		// 		undefined,
		// 		onFail,
		// 		func,
		// 		undefined,
		// 		this._stabilityPoolContract[token.symbol]?.address,
		// 		amt
		// 	);
		// }
	},

	swap: async function (wenAmount, collateralPrice, onWait, onFail, onDone, market = IOTX) {
		const amount = wenAmount.toFixed();

		let res: any = await this._hintHelpersContract[market.symbol]?.dappFunctions.getRedemptionHints.call(wenAmount.toFixed(), BigNumber(collateralPrice).shiftedBy(18).toFixed(), 0);
		const firstRedemptionHint = res.firstRedemptionHint;
		const partialRedemptionHintNICR = BigNumber(res.partialRedemptionHintNICR._hex);

		res = await this._sortedTrovesContract[market.symbol]?.dappFunctions.findInsertPosition.call(partialRedemptionHintNICR.toFixed(), this._account!, this._account!);
		const upperPartialRedemptionHint = res[0];
		const lowerPartialRedemptionHint = res[1];

		this._troveManagerContract[market.symbol]?.dappFunctions.redeemCollateral.run(
			onWait,
			onFail,
			onDone,
			{ from: this._account },
			amount,
			firstRedemptionHint,
			upperPartialRedemptionHint,
			lowerPartialRedemptionHint,
			partialRedemptionHintNICR.toFixed(),
			0,
			BigNumber(1).shiftedBy(WEN.decimals).toFixed()
		);
	},

	getRedemptionFeeWithDecay: async function (amount, market = IOTX): Promise<BigNumber> {
		const res: any = await this._troveManagerContract[market.symbol]?.dappFunctions.getRedemptionFeeWithDecay.call(amount.toFixed());
		return BigNumber(res._hex);
	},

	getTotalCollateralRatio: function (collateralToken = IOTX): number {
		if (!this.magmaData.entireSystemColl || !this.magmaData.entireSystemDebt || !this.magmaData.price) return 0;

		return Vault.computeCollateralRatio(
			this.magmaData.entireSystemColl[collateralToken.symbol],
			this.magmaData.entireSystemDebt[collateralToken.symbol],
			this.magmaData.price[collateralToken.symbol],
			1,
			collateralToken,
			WEN
		);
	},

	liquidate: function (borrower: string, onWait?, onFail?, onDone?, token = "IOTX"): void {
		this._troveManagerContract[token]?.dappFunctions.liquidate.run(
			onWait,
			onFail,
			onDone,
			{ from: this._account },
			borrower
		);
	},

	calculateTVL: function (): number {
		let sum = 0;

		this._tokensAsKey.forEach(key => {
			const amountDecimals = formatAssetAmount(this.magmaData.TVL[key], this._magmaCfg.tokens[key].decimals);
			const price = this.magmaData.price[key];
			sum += amountDecimals * price;
		});

		return sum;
	},

	calculateTotalWENStaked: function (): number {
		let sum = 0;

		this._tokensAsKey.forEach(key => {
			const amountDecimals = formatAssetAmount(this.magmaData.lusdInStabilityPool[key], this._magmaCfg.tokens[key].decimals);
			sum += amountDecimals;
		});

		return sum;
	},

	_readyTokens: function (): void {
		this._tokensAsKey.forEach(key => {
			const theToken = this._magmaCfg.tokens[key];
			this.tokens[key] = {
				symbol: theToken.symbol,
				logo: theToken.logo,
				decimals: theToken.decimals,
				address: theToken.address
			} as Coin;
		});
	},

	calculateTVLOfAllVault: function (vaults: any, prices: any): number {
		let sum = 0;
		Object.entries(vaults).forEach(items => {
			const key: string = items[0];
			const vault = items[1] as Vault;
			sum += vault.collateralDecimals * prices[key];
		});
		return sum;
	},

	calculateTotalLoanOfAllVault: function (vaults: any): number {
		let sum = 0;
		Object.values(vaults).forEach(vault => {
			sum += (vault as Vault).debtDecimals;
		});
		return sum;
	},

	calculateTotalStakedOfAllVault: function (): number {
		let sum = 0;

		this._tokensAsKey.forEach(key => {
			const amountDecimals = formatAssetAmount(this.magmaData.stabilityDeposit[key].currentLUSD, this._magmaCfg.tokens[key].decimals);
			sum += amountDecimals;
		});

		return sum;
	},

	calculateRedemptionFee: function (amount: BigNumber, rate: BigNumber): BigNumber | undefined {
		try {
			const fee = rate.multipliedBy(amount).dividedBy(globalContants.BIG_NUMBER_1);
			if (BigNumber.isBigNumber(fee)) {
				return fee;
			}
		} catch (error) {
			console.error(error);
		}
	},

	getRedemptionRate: function (market: Coin): Promise<BigNumber> {
		return new Promise((resolve, reject) => {
			magma._troveManagerContract[market.symbol]?.dappFunctions.getRedemptionRate.call().then((res: any) => {
				if (res)
					resolve(BigNumber(res._hex));
				else
					reject();
			}).catch(reject);
		});
	}
};