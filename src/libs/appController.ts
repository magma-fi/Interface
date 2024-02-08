import { Langs, globalContants } from "./globalContants";
import appConfig from "../appConfig.json"
import { JsonObject } from "./types";
import { graphqlAsker } from "./graphqlAsker";

export const appController: {
	lang: Langs | null;
	worker?: Worker;
	init: () => void;
	detectLang: () => void;
	changeLang: (lng: Langs) => void;
	relaunch: () => void;
	employWorkers: (chainId: number, onDone?: () => void) => void;
	_dbConnector: IDBOpenDBRequest | undefined;
	_db: IDBDatabase | undefined;
	openDB: (chainId: number, onDone: () => void) => void;
	readAll: (onDone: (arg?: IDBCursor) => void) => void;
	getUserPoints: (chainId: number, user: string, referrer: string, onDone: (point: number) => void) => void;
	_getUserWENScore: (chainId: number, user: string) => Promise<number>;
	_getLPScore: (chainId: number, user: string) => Promise<number>;
	_getUserStabilityAndLpScore: (chainId: number, user: string, onDone: (res: Record<string, number>) => void) => void;
} = {
	_dbConnector: undefined,
	_db: undefined,
	lang: null,

	init: function () {
		this.detectLang();
	},

	detectLang: function () {
		if (!this.lang) {
			this.lang = window.localStorage.getItem(globalContants.APP_LANG) as Langs;
		}

		if (!this.lang) {
			this.lang = Langs.English;
		}
	},

	changeLang: function (lng: Langs) {
		this.lang = lng;
		window.localStorage.setItem(globalContants.APP_LANG, lng);
	},

	relaunch: function () {
		window.location.reload();
	},

	employWorkers: function (chainId, onDone?: () => void) {
		this.worker = new Worker("/workers/get-history.js", {
			type: "classic"
		});

		this.worker.addEventListener("message", e => {
			if (e.data === "openned") onDone && onDone();
			if (e.data === "fetched") this.worker?.terminate();
		});

		this.worker.addEventListener('error', err => {
			console.error(err);
		});

		this.worker.addEventListener('messageerror', err => {
			console.error(err);
		});

		this.worker.postMessage({
			cmd: "fetch",
			params: chainId
		});
	},

	openDB: function (chainId, onDone: () => void) {
		this._dbConnector = window.indexedDB.open("magma-db-" + chainId, 1);

		this._dbConnector.onerror = event => {
			console.error('数据库打开出错', event);
		};

		this._dbConnector.onsuccess = () => {
			this._db = this._dbConnector?.result;
			return onDone && onDone();
		};
	},

	readAll: function (onDone) {
		let objectStore = null;

		try {
			objectStore = this._db?.transaction("history", "readonly").objectStore("history");
		} catch (error) {
			console.warn(error);
		}

		if (objectStore) {
			objectStore.openCursor().onsuccess = (event) => {
				const cursor: IDBCursor = event.target.result;
				if (cursor) {
					return onDone && onDone(cursor);
				}
			};
		} else {
			return onDone && onDone();
		}
	},

	getUserPoints: function (chainId, user, referrer, onDone): void {
		this._getUserStabilityAndLpScore(chainId, user, res => {
			let myUsersPoints = 0;

			if (!referrer) return onDone && onDone(res.stabilityScore + res.lpScore);

			// 根据referrer取得用户的下线。
			const query = graphqlAsker.requestUsersWithReferrer(referrer);
			graphqlAsker.ask(chainId, query, (result: any) => {
				if (result?.users) {
					const myUsers = result.users.map((item: { id: string; }) => '"' + item.id + '"');
					if (myUsers.length > 0) {
						const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];

						const stabilityScoreGraph = cfg?.stabilityScore;
						const question4Wen = graphqlAsker.requestWENScoreOfUsers(myUsers);
						graphqlAsker.ask(
							chainId,
							question4Wen,
							(stabilityScoreRes: any) => {
								if (stabilityScoreRes?.users) {
									stabilityScoreRes?.users.forEach((element: any) => {
										const p = Number(element.point.point);
										if (!isNaN(p)) myUsersPoints += p;

										const d = Number(element.stabilityDeposit.depositedAmount);
										if (!isNaN(d)) myUsersPoints += d * 10 * (Date.now() - element.point.timestamp * 1000) / 3600000;
									});
								}

								const lpScoreGraph = cfg?.lpScore;
								const question = graphqlAsker.requestLPScoreOfUsers(myUsers);
								graphqlAsker.ask(
									chainId,
									question,
									(lpScoreRes: any) => {
										if (lpScoreRes?.users) {
											lpScoreRes.users.forEach((element: any) => {
												myUsersPoints += (
													Number(element.point.point)
													+ (Number(element.user.balance.balance) / 10 ** 18) * 4 * (Date.now() - element.user.point.timestamp * 1000) / 3600000
												);
											});
										}

										return onDone && onDone(res.stabilityScore + res.lpScore + myUsersPoints * 0.1);
									},
									lpScoreGraph
								);
							},
							stabilityScoreGraph
						);
					} else {
						return onDone && onDone(res.stabilityScore + res.lpScore);
					}
				}
			});
		});
	},

	_getUserStabilityAndLpScore: async function (chainId, user, onDone) {
		const res = {
			stabilityScore: 0,
			lpScore: 0
		};

		res.stabilityScore = await this._getUserWENScore(chainId, user);
		res.lpScore = await this._getLPScore(chainId, user);

		return onDone && onDone(res);
	},

	_getUserWENScore: function (chainId, user) {
		return new Promise((resolve) => {
			const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];
			const stabilityScoreGraph = cfg?.stabilityScore;
			let stabilityScore = 0;
			if (stabilityScoreGraph) {
				const query = graphqlAsker.requestUserWENScore(user);
				graphqlAsker.ask(
					chainId,
					query,
					(data: any) => {
						// 基础积分 = subgraph里的point字段 + AMOUNT * (当前时间 - timestamp ) * 10 / 3600000
						if (data.user) {
							const p = Number(data.user.point.point);
							if (!isNaN(p)) stabilityScore = p;

							const d = Number(data.user.stabilityDeposit.depositedAmount);
							if (!isNaN(d)) stabilityScore += d * 10 * (Date.now() - data.user.point.timestamp * 1000) / 3600000;
						}

						resolve(stabilityScore);
					},
					stabilityScoreGraph
				);
			} else {
				resolve(0);
			}
		});
	},

	_getLPScore: function (chainId, user) {
		return new Promise(resolve => {
			const cfg = (appConfig.subgraph as JsonObject)[String(chainId)];
			const lpScoreGraph = cfg?.lpScore;
			let lpScore = 0;
			if (lpScoreGraph) {
				const query = graphqlAsker.requestUserLPScore(user);
				graphqlAsker.ask(
					chainId,
					query,
					(data: any) => {
						if (data.user) lpScore = Number(data.user.point.point) + (Number(data.user.balance.balance) / 10 ** 18) * 4 * (Date.now() - data.user.point.timestamp * 1000) / 3600000;

						resolve(lpScore);
					},
					lpScoreGraph
				);
			} else {
				resolve(0);
			}
		});
	}
};