import { Langs, globalContants } from "./globalContants";

export const appController: {
	lang: Langs | null;
	init: () => void;
	detectLang: () => void;
	changeLang: (lng: Langs) => void;
	relaunch: () => void;
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
	}
};