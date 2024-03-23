/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { DappContract } from "./DappContract.";
import appConfig from "../appConfig.json";
import { ApproxHintObject, Coin, JsonObject, StabilityDeposit, VaultStatus, Vaultish, callRequest } from "./types";
import MultiTroveGetterAbi from "../abis/MultiTroveGetter.json";
import { Vault } from "./Vault";
import { graphqlAsker } from "./graphqlAsker";
import { IOTX, WEN, globalContants } from "./globalContants";
import { BigNumber } from "bignumber.js";
import multicallAbi from "../abis/multicall.json";
import troveManagerAbi from "../abis/TroveManager.json";
import priceFeedAbi from "../abis/PriceFeed.json";
import lusdTokenAbi from "../abis/LUSDToken.json";
import borrowerOperationsAbi from "../abis/BorrowerOperations.json";
import sortedTrovesAbi from "../abis/SortedTroves.json";
import hintHelpersAbi from "../abis/HintHelpers.json";
import stabilityPoolAbi from "../abis/StabilityPool.json";
import { JsonRpcSigner } from "@ethersproject/providers";
import { providers } from 'ethers';
import { multicaller } from "./multicaller";
import { generateTrials, randomInteger } from "../utils";

export const magma: {
	borrowerOperationsContract?: DappContract;
	magmaData: Record<string, any>;
	vaults: Vault[];
	_account: string;
	_currentChainId: number;
	_magmaCfg: JsonObject;
	_multicallContract?: DappContract;
	_lusdTokenContract?: DappContract;
	_sortedTrovesContract?: DappContract;
	_hintHelpersContract?: DappContract;
	_troveManagerContract?: DappContract;
	_priceFeedContract?: DappContract;
	_stabilityPoolContract?: DappContract;
	_signer?: providers.JsonRpcSigner;
	_borrowingRate: number;
	_wenGasCompensation: BigNumber;
	init: (chainId: number, signer: JsonRpcSigner, account?: string) => void;
	getVaults: (forceReload: boolean, doneCallback?: (vs: Vault[]) => void) => void;
	getMagmaData: () => Promise<Record<string, any> | undefined>;
	getVaultByOwner: (owner: string) => Promise<Vault | undefined>;
	findHintsForNominalCollateralRatio: (nominalCollateralRatio: number, ownAddress?: string) => Promise<[string, string]>;
	wouldBeRecoveryMode: (collateral: BigNumber, debt: BigNumber, collateralPrice: number, loanPrice: number, collateralToken: Coin, loanToken: Coin) => boolean;
	computeFee: () => number;
	openVault: (vault: Vault, maxFeePercentage: number, debtChange: BigNumber, deposit: BigNumber, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	closeVault: (onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	stake: (amount: BigNumber, frontendTag: string, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	unstake: (amount: BigNumber, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => void;
	swap: (wenAmount: BigNumber, collateralPrice: number, onWait?: (tx: string) => void, onFail?: (error: Error | any) => void, onDone?: (tx: string) => void) => Promise<void>;
	getRedemptionFeeWithDecay: (amount: BigNumber) => Promise<BigNumber>;
	getTotalCollateralRatio: (collateralToken?: Coin) => number;
	_readyContracts: () => void;
	_getMagmaDataStep1: () => Promise<void>;
	_getMagmaDataStep2: () => Promise<void>;
	_loadingData: boolean;
} = {
	_account: globalContants.ADDRESS_PLACEHOLDER,
	_loadingData: false,
	_currentChainId: globalContants.DEFAULT_NETWORK_ID,
	_magmaCfg: {},
	vaults: [],
	magmaData: {},
	_borrowingRate: 0,
	_wenGasCompensation: globalContants.BIG_NUMBER_0,

	init: function (chainId: number, signer: providers.JsonRpcSigner, account?: string) {
		this._signer = signer;
		this._currentChainId = chainId;
		this._magmaCfg = (appConfig.magma as JsonObject)[String(chainId)];

		if (account) this._account = account;

		this._readyContracts();
	},

	getMagmaData: async function (): Promise<Record<string, any> | undefined> {
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
				console.debug("xxx 原始数据", data, query);

				if (data?.troves) {
					data.troves.forEach((vault: JsonObject) => {
						this.vaults.push(
							new Vault({
								id: vault.id,
								status: vault.status as VaultStatus,
								collateral: BigNumber(vault.rawCollateral),
								debt: BigNumber(vault.rawDebt),
								collateralRatioSortKey: vault.collateralRatioSortKey
							} as Vaultish,
								IOTX,
								this._wenGasCompensation,
								this._borrowingRate
							));
					});
				}

				return doneCallback && doneCallback(this.vaults);
			});
		} else {
			return doneCallback && doneCallback(this.vaults);
		}
	},

	getVaultByOwner: async function (owner: string): Promise<Vault | undefined> {
		const res: any = await this._troveManagerContract?.dappFunctions.Troves.call(owner);
		if (res) {
			return new Vault(
				{
					id: owner,
					debt: BigNumber(res.debt._hex),
					collateral: BigNumber(res.coll._hex),
					stake: BigNumber(res.stake._hex),
					status: res.status as VaultStatus,
					arrayIndex: BigNumber(res.arrayIndex._hex)
				} as Vaultish,
				IOTX,
				this._wenGasCompensation,
				this._borrowingRate,
				this._currentChainId
			);
		}
	},

	computeFee: function (): number {
		// return this.magmaData.recoveryMode ? 0 : Decimal.min(MINIMUM_BORROWING_RATE.add(this.baseRate(when)), MAXIMUM_BORROWING_RATE);
		return 0;
	},

	openVault: async function (vault: Vault, maxFeePercentage: number, debtChange: BigNumber, deposit: BigNumber, onWait, onFail, onDone) {
		const hints = await this.findHintsForNominalCollateralRatio(vault.nominalCollateralRatio(), vault.id);
		this.borrowerOperationsContract?.dappFunctions.openTrove.run(
			onWait,
			onFail,
			onDone,
			{ value: deposit.toFixed() },
			BigNumber(maxFeePercentage).shiftedBy(18).toFixed(),
			debtChange.toFixed(),
			hints[0],
			hints[1]
		);
	},

	_readyContracts: function (): void {
		if (this._magmaCfg.multicaller) {
			this._multicallContract = new DappContract(this._magmaCfg.multicaller, multicallAbi, this._signer);
			multicaller.init(this._multicallContract);
		}

		if (this._magmaCfg.troveManager) {
			this._troveManagerContract = new DappContract(this._magmaCfg.troveManager, troveManagerAbi, this._signer);
		}

		if (this._magmaCfg.priceFeed) {
			this._priceFeedContract = new DappContract(this._magmaCfg.priceFeed, priceFeedAbi, this._signer);
		}

		if (this._magmaCfg.lusdToken) {
			this._lusdTokenContract = new DappContract(this._magmaCfg.lusdToken, lusdTokenAbi, this._signer);
		}

		if (this._magmaCfg.borrowerOperations) {
			this.borrowerOperationsContract = new DappContract(this._magmaCfg.borrowerOperations, borrowerOperationsAbi, this._signer);
		}

		if (this._magmaCfg.sortedTroves) {
			this._sortedTrovesContract = new DappContract(this._magmaCfg.sortedTroves, sortedTrovesAbi, this._signer);
		}

		if (this._magmaCfg.hintHelpers) {
			this._hintHelpersContract = new DappContract(this._magmaCfg.hintHelpers, hintHelpersAbi, this._signer);
		}

		if (this._magmaCfg.stabilityPool) {
			this._stabilityPoolContract = new DappContract(this._magmaCfg.stabilityPool, stabilityPoolAbi, this._signer);
		}
	},

	_getMagmaDataStep1: async function (): Promise<void> {
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
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.getEntireSystemDebt.encode(),
			parseFunc: args => {
				this.magmaData.entireSystemDebt = BigNumber(args as string);
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.getTroveOwnersCount.encode(),
			parseFunc: args => {
				this.magmaData.vaultsCount = BigNumber(args as string).toNumber();
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.getBorrowingRateWithDecay.encode(),
			parseFunc: args => {
				this.magmaData.borrowingRateWithDecay = BigNumber(args as string).shiftedBy(-18).toNumber();
				this._borrowingRate = this.magmaData.borrowingRateWithDecay;
			}
		} as callRequest);

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

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.getDepositorETHGain.encode(this._account),
			parseFunc: args => {
				this.magmaData.stabilityDeposit = {
					...this.magmaData.stabilityDeposit,
					collateralGain: BigNumber(args as string)
				} as StabilityDeposit;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.getCompoundedLUSDDeposit.encode(this._account),
			parseFunc: args => {
				this.magmaData.stabilityDeposit = {
					...this.magmaData.stabilityDeposit,
					currentLUSD: BigNumber(args as string)
				} as StabilityDeposit;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.getDepositorLQTYGain.encode(this._account),
			parseFunc: args => {
				this.magmaData.stabilityDeposit = {
					...this.magmaData.stabilityDeposit,
					lqtyReward: BigNumber(args as string)
				} as StabilityDeposit;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.deposits.encode(this._account),
			parseFunc: args => {
				const res: any = this._stabilityPoolContract?.interface.decodeFunctionResult("deposits", args);
				this.magmaData.stabilityDeposit = {
					...this.magmaData.stabilityDeposit,
					initialValue: BigNumber(res[0] as string),
					frontEndTag: res[1]
				} as StabilityDeposit;
			}
		} as callRequest);

		multicaller.addCall({
			contractAddress: this._stabilityPoolContract?.address,
			call: this._stabilityPoolContract?.dappFunctions.getTotalLUSDDeposits.encode(),
			parseFunc: args => {
				const res: any = this._stabilityPoolContract?.interface.decodeFunctionResult("getTotalLUSDDeposits", args);
				this.magmaData.lusdInStabilityPool = BigNumber(res[0]._hex);
			}
		} as callRequest);

		await multicaller.batchingCall();
	},

	_getMagmaDataStep2: async function (): Promise<void> {
		multicaller.addCall({
			contractAddress: this._troveManagerContract?.address,
			call: this._troveManagerContract?.dappFunctions.checkRecoveryMode.encode(BigNumber(this.magmaData.price).shiftedBy(18).toFixed(0)),
			parseFunc: args => {
				this.magmaData.recoveryMode = Boolean(BigNumber(args as string).toNumber());
			}
		} as callRequest);

		await multicaller.batchingCall();
	},

	findHintsForNominalCollateralRatio: async function (nominalCollateralRatio: number, ownAddress?: string): Promise<[string, string]> {
		const numberOfTroves = this.magmaData.vaultsCount;

		if (!numberOfTroves) {
			return [globalContants.ADDRESS_0, globalContants.ADDRESS_0];
		}

		if (!Number.isFinite(nominalCollateralRatio)) {
			const res = await this._sortedTrovesContract?.dappFunctions.getFirst.call();
			return [globalContants.ADDRESS_0, res as unknown as string];
		}

		const nominalCollateralRatioNumber = BigNumber(nominalCollateralRatio).shiftedBy(18).toFixed();
		const totalNumberOfTrials = Math.ceil(10 * Math.sqrt(numberOfTroves));
		const [firstTrials, ...restOfTrials] = generateTrials(totalNumberOfTrials, this._currentChainId);

		const collectApproxHint = async (
			argObject: ApproxHintObject,
			numberOfTrials: number
		) => {
			const res: any = await this._hintHelpersContract?.dappFunctions.getApproxHint.call(
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

		const positionResult: any = await this._sortedTrovesContract?.dappFunctions.findInsertPosition.call(
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
				prev = await this._sortedTrovesContract?.dappFunctions.getPrev.call(prev);
			} else if (next === ownAddress) {
				next = await this._sortedTrovesContract?.dappFunctions.getNext.call(next);
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
		if (!this.magmaData?.entireSystemColl || !this.magmaData?.entireSystemDebt || !this.magmaData?.CCR) throw new Error("magmaData.* is null");

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

	closeVault: function (onWait, onFail, onDone): void {
		this.borrowerOperationsContract?.dappFunctions.closeTrove.run(onWait, onFail, onDone, { from: this._account });
	},

	stake: function (amount, frontendTag, onWait, onFail, onDone): void {
		this._stabilityPoolContract?.dappFunctions.provideToSP.run(
			onWait,
			onFail,
			onDone,
			{ from: this._account },
			amount.toFixed(),
			frontendTag
		);
	},

	unstake: function (amount, onWait, onFail, onDone): void {
		this._stabilityPoolContract?.dappFunctions.provideToSP.run(
			onWait,
			onFail,
			onDone,
			{ from: this._account },
			amount.toFixed()
		);
	},

	swap: async function (wenAmount, collateralPrice, onWait, onFail, onDone) {
		let res = await this._hintHelpersContract?.dappFunctions.getRedemptionHints.call(wenAmount.toFixed(), BigNumber(collateralPrice).shiftedBy(18).toFixed(), 0);
		const firstRedemptionHint = res.firstRedemptionHint;
		const partialRedemptionHintNICR = BigNumber(res.partialRedemptionHintNICR._hex);
		console.debug("xxx 结果", res, firstRedemptionHint, partialRedemptionHintNICR.toFixed());

		res = await this._sortedTrovesContract?.dappFunctions.findInsertPosition.call(partialRedemptionHintNICR.toFixed(), this._account!, this._account!);
		const upperPartialRedemptionHint = res[0];
		const lowerPartialRedemptionHint = res[1];
		console.debug("xxx 结果", res, upperPartialRedemptionHint, lowerPartialRedemptionHint);

		this._troveManagerContract?.dappFunctions.redeemCollateral.run(
			onWait,
			onFail,
			onDone,
			{ from: this._account },
			wenAmount.toFixed(),
			firstRedemptionHint,
			upperPartialRedemptionHint,
			lowerPartialRedemptionHint,
			partialRedemptionHintNICR.toFixed(),
			0,
			BigNumber(1).shiftedBy(WEN.decimals).toFixed()
		);
	},

	getRedemptionFeeWithDecay: async function (amount): Promise<BigNumber> {
		const res = await this._troveManagerContract?.dappFunctions.getRedemptionFeeWithDecay.call(amount.toFixed());
		return BigNumber(res._hex);
	},

	getTotalCollateralRatio: function (collateralToken = IOTX): number {
		if (!this.magmaData.entireSystemColl || !this.magmaData.entireSystemDebt || !this.magmaData.price) return 0;

		return Vault.computeCollateralRatio(
			this.magmaData.entireSystemColl,
			this.magmaData.entireSystemDebt,
			this.magmaData.price,
			1,
			collateralToken,
			WEN
		);
	}
};