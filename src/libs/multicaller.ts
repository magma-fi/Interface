import { DappContract } from "./DappContract.";
import { callRequest } from "./types";

export const multicaller: {
	_multicallContract?: DappContract;
	_calls: callRequest[];
	init: (multicallContract: DappContract) => void;
	batchingCall: () => void;
	addCall: (call: callRequest) => void;
} = {
	_calls: [],

	init: function (multicallContract: DappContract) {
		this._multicallContract = multicallContract;
	},

	addCall: function (call: callRequest) {
		if (call) this._calls.push(call);
	},

	batchingCall: async function () {
		if (this._calls.length === 0) return;

		const params = this._calls.map(call => {
			return [call.contractAddress, call.call];
		});
		const res = await this._multicallContract?.dappFunctions.aggregate.staticCall(params);
		if (res) {
			const resultData = res[1];
			this._calls.forEach((item, idx) => {
				return item.parseFunc && item.parseFunc(resultData[idx])
			});
		}

		this._calls.splice(0, this._calls.length);
	}
};