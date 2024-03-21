/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Provider, TransactionReceipt, TransactionResponse } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "ethers";
import { ContractInterface, ContractFunction, Contract } from "@ethersproject/contracts"
import { MixedError } from "./types";
import { Interface } from "@ethersproject/abi";

type TransactionState = "idle" | "estimatingGas" | "waitingForConfirmation" | "failed" | "confirmed";

class TransactionTracker {
	public hash = "";
	public error?: Error | unknown;
	public onWait?: (tx: string) => void;
	public onFail?: (err: Error | unknown) => void;
	public onDone?: (tx: string) => void

	private _state: TransactionState = "idle";

	public get state() {
		return this._state;
	}

	public set state(val: TransactionState) {
		this._state = val;

		switch (val) {
			case "waitingForConfirmation":
				this.onWait && this.onWait(this.hash);
				break;

			case "failed":
				this.onFail && this.onFail(this.error);
				break;

			case "confirmed":
				this.onDone && this.onDone(this.hash);
				break;

			case "idle":
			case "estimatingGas":
			default:
				break;
		}
	}
}

class TrackableFunction {
	private _signature = "";
	private _estimateGasFunc: ContractFunction<BigNumber> | undefined;
	private _method: ContractFunction<TransactionResponse> | undefined;
	private _callStatic: boolean;
	private _interface: Interface;
	private _forcedStaticCallMethod?: ContractFunction<TransactionResponse> | undefined;

	private _tracker = new TransactionTracker();
	public get tracker() {
		return this._tracker;
	}

	constructor(signature: string, estimateGas: ContractFunction, method: ContractFunction, callStatic: boolean, i: Interface, forcedStaticCallMethod?: ContractFunction) {
		this._signature = signature;
		this._estimateGasFunc = estimateGas;
		this._method = method;
		this._callStatic = callStatic;
		this._interface = i;
		this._forcedStaticCallMethod = forcedStaticCallMethod;
		this._tracker = new TransactionTracker();
	}

	public encode(...args: unknown[]): string {
		return this._interface.encodeFunctionData(this._signature, [...args]);
	}

	public async call(...args: unknown[]) {
		if (this._method) {
			return await this._method(...args);
		}
	}

	public async staticCall(...args: unknown[]) {
		const func = this._callStatic ? this._method : this._forcedStaticCallMethod
		if (func) {
			return await func(...args);
		}
	}

	public async run(
		onWait?: (tx: string) => void,
		onFail?: (error: Error | any) => void,
		onDone?: (tx: string) => void,
		overrides?: Record<string, any>,
		...args: unknown[]
	) {
		this._tracker.onWait = onWait;
		this._tracker.onFail = onFail;
		this._tracker.onDone = onDone;

		if (this._callStatic) {
			this._tracker.error = new Error("static call");
			this._tracker.state = "failed";
		}

		let gasLimit = BigNumber.from(0);

		if (this._estimateGasFunc) {
			try {
				this._tracker.state = "estimatingGas";

				gasLimit = await this._estimateGasFunc(...args, overrides);
			} catch (error) {
				this._trackerGetError(error);
			}
		}

		if (this._method) {
			let res: TransactionResponse | undefined;
			try {
				if (gasLimit?.isZero()) {
					res = await this._method(...args, overrides);
				} else {
					res = await this._method(...args, {
						...overrides,
						gasLimit: gasLimit.toString()
					});
				}
			} catch (error) {
				console.error(error);
				this._trackerGetError(error);
			}

			if (res?.hash) {
				this._tracker.hash = res.hash;
				this._tracker.state = "waitingForConfirmation";
			}

			if (res) {
				const receipts: TransactionReceipt = await res.wait();

				if (!receipts) {
					this._tracker.error = new Error("the transaction has not been mined");
					this._tracker.state = "failed";
				}

				if (receipts.status === 1) {
					this._tracker.state = "confirmed";
				}
			}
		}
	}

	private _trackerGetError(error: Error | unknown) {
		const err = error as MixedError;
		this._tracker.error = new Error(err.reason || err.data?.message || err.message || JSON.stringify(error).substring(0, 100));
		this._tracker.state = "failed";
	}
}

export class DappContract extends Contract {
	public dappFunctions: {
		[key: string]: TrackableFunction;
	} = {};

	constructor(addressOrName: string, contractInterface: ContractInterface, signerOrProvider?: Signer | Provider) {
		super(addressOrName, contractInterface, signerOrProvider);

		Object.keys(this.interface.functions).forEach((signature) => {
			const fragment = this.interface.functions[signature];
			const staticCall = fragment.stateMutability === "view";

			this.dappFunctions[fragment.name] = new TrackableFunction(
				fragment.name,
				this.estimateGas[signature],
				staticCall ? this.callStatic[signature] : this.functions[signature],
				staticCall,
				this.interface,
				!staticCall ? this.callStatic[signature] : undefined
			);
		});
	}
}