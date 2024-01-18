/* eslint-disable no-undef */
// import { graphQLFetch } from "./graphql-fetch";
importScripts("./graphql-fetch.js");
importScripts("./db-manager.js");

const table = "history";
let db = null;
let historyCap = 7;
let currentCalling = 0;
const sequenceNumbers = [];

const getSystemStateWithSequenceNumbers = async () => {
	const idList = sequenceNumbers.map(item => item.id).flat();
	const res = await graphQLFetch.requestSystemStateWithDay(...idList);
	if (res?.systemStates?.length > 0) {
		const dataObjs = [];

		res.systemStates.forEach((item, idx) => {
			const dataObj = {
				date: sequenceNumbers[idx].date,
				collateral: Number(item.totalCollateral),
				debt: Number(item.totalDebt)
			};

			if (sequenceNumbers[idx].forceUpdate) {
				setTimeout(() => {
					dbManager.update(db, table, dataObj)
				}, 1000);
			} else {
				dataObjs.push(dataObj);
			}
		});

		if (dataObjs.length > 0) {
			await dbManager.add(db, table, dataObjs);
		}

		return;
	}
};

const getHistoryByDate = async (day) => {
	if (currentCalling >= historyCap) {
		return await getSystemStateWithSequenceNumbers();
	};

	const dayStr = day.toLocaleDateString()
	const hasVal = await dbManager.read(db, table, "date", dayStr);

	if (!hasVal) {
		const beginOfDay = Math.floor(new Date(dayStr).getTime() / 1000);
		const endOfDay = beginOfDay + 86399;
		const sns = await graphQLFetch.requestSequenceNumbersWithDay(beginOfDay, endOfDay);

		if (sns?.troveChanges?.length > 0) {
			sequenceNumbers.push({
				date: dayStr,
				id: sns.troveChanges[0].id,
				forceUpdate: !!hasVal
			});
		}
	}

	currentCalling += 1;

	await getHistoryByDate(new Date(day - 86400000));
};

const main = async (chainId) => {
	db = await dbManager.open("magma-db-" + chainId, 1);

	graphQLFetch.init(chainId);

	if (db) {
		await getHistoryByDate(new Date(), true);
	}

};

this.addEventListener('message', async e => {
	if (e.data.cmd === "fetch") {
		await main(e.data.params);
		this.postMessage("fetched"); // 向主线程发送消息
		this.close();
	}
});