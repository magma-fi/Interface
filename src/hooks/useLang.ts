import { useEffect, useState } from "react";
import { Langs } from "../libs/globalContants";
import { appController } from "../libs/appController";

let currentLang: Langs = Langs.English;
// let localizedStrings: Record<string, string> | null = null;

export function useLang() {
	const appLang = appController.lang;
	const [localizedStrings, setLocalizedStrings] = useState(null);

	const getStrings = async () => {
		let res = null;
		try {
			res = await (await fetch("/locale/" + currentLang + ".json")).json();
		} catch (error) {
			console.error(error);
		}

		setLocalizedStrings(res);
	};

	useEffect(() => {
		currentLang = appLang;
		getStrings();
	}, [appLang]);

	const t = (key: string, valuesObject: (Record<string, string> | null) = null) => {
		if (!localizedStrings) {
			return "";
		} else {
			const str = (localizedStrings && key) ? localizedStrings[key] : "";
			return valuesObject ? str.replace(/\{(\w+)\}/g, (match, key) => {
				return valuesObject[key] || match;
			}) : str;
		}
	}

	return { t };
}
