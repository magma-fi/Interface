const graphQLFetch = {
	_subgraphURL: "",

	init: function (chainId) {
		if (chainId === 4690) {
			// magma-iotex-testnet-demo-erc20
			// magma-subgraph-iotex-testnet
			this._subgraphURL = "https://graphnode.filda.io/subgraphs/name/magma-subgraph-iotex-testnet";
		} else {
			// this._subgraphURL = "https://graphnode.filda.io/subgraphs/name/magma-subgraph-iotex-v2"
			this._subgraphURL = "https://graphnode.filda.io/subgraphs/name/magma-iotex-v3"
		}
	},

	requestSequenceNumbersWithDay: async function (beginTime, endTime) {
		const data = JSON.stringify({
			query: `
		{
			troveChanges(
				first: 1
				where: {transaction_: {timestamp_gt: ${beginTime}, timestamp_lt: ${endTime}}}
				orderBy: transaction__timestamp
				orderDirection: desc
			) {
				id: sequenceNumber
			}
		}
		`});

		return await this.request(data);
	},

	requestSystemStateWithDay: async function (...idList) {
		const data = JSON.stringify({
			query: `
			{
				systemStates(where: {sequenceNumber_in: [${idList}]}) {
					totalCollateral
					totalDebt
					id
				}
			}
		`});

		return await this.request(data);
	},

	request: async function (query) {
		const response = await fetch(this._subgraphURL, {
			method: 'post',
			body: query,
			headers: { 'Content-Type': 'application/json' },
		});

		const json = await response.json();
		if (json?.data) {
			return json.data;
		}
	}
};