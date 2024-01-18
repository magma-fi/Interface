import { Langs, globalContants } from "./globalContants";

export const appController: {
	lang: Langs | null;
	worker?: Worker;
	init: () => void;
	detectLang: () => void;
	changeLang: (lng: Langs) => void;
	relaunch: () => void;
	employWorkers: (chainId: number, onDone?: () => void) => void;
	_dbConnector: IDBOpenDBRequest;
	_db: IDBDatabase;
	openDB: (chainId: number, onDone: () => void) => void;
	readAll: (onDone: (arg: IDBCursor) => void) => void;
} = {
	lang: null,

	init: function () {
		this.detectLang();
	},

	detectLang: function () {
		if (!this.lang) {
			this.lang = window.localStorage.getItem(globalContants.APP_LANG) as Langs;
		}

		if (!this.lang) {
			this.lang = Langs.English
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
			if (e.data === "fetched") onDone && onDone();
			this.worker?.terminate();
		})

		this.worker.addEventListener('error', err => {
			console.error(err);
		});

		this.worker.addEventListener('messageerror', err => {
			console.error(err)
		});

		this.worker.postMessage({
			cmd: "fetch",
			params: chainId
		});
	},

	openDB: function (chainId, onDone: () => void) {
		this._dbConnector = window.indexedDB.open("magma-db-" + chainId, 1);

		this._dbConnector.onerror = event => {
			console.error('数据库打开报错', event);
		};

		this._dbConnector.onsuccess = () => {
			this._db = this._dbConnector.result;
			return onDone && onDone();
		};
	},

	readAll: function (onDone) {
		const objectStore = this._db.transaction(["history"]).objectStore("history");

		objectStore.openCursor().onsuccess = (event) => {
			const cursor: IDBCursor = event.target.result;
			if (cursor) {
				return onDone && onDone(cursor);
			}
		};
	}
};