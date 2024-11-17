/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Langs } from "../libs/globalContants";
import { appController } from "../libs/appController";

const localizedStringsBundle: Record<string, any> = {};

export function useLang() {
	const appLang = appController.lang;
	const [localizedStrings, setLocalizedStrings] = useState(null);

	const getStrings = async (lang: Langs) => {
		let res = null;
		try {
			res = await (await fetch("/locale/" + lang + ".json")).json();
		} catch (error) {
			console.error(error);
		}

		localizedStringsBundle[lang] = res;
		setLocalizedStrings(res);
	};

	useEffect(() => {
		if (localizedStringsBundle[appLang]) {
			setLocalizedStrings(localizedStringsBundle[appLang]);
		} else {
			getStrings(appLang);
		}
	}, [appLang]);

	const t = (key: string, valuesObject: (Record<string, string> | null) = null) => {
		if (!localizedStrings) {
			return key;
		} else {
			const str = (localizedStrings && key) ? localizedStrings[key] : "";
			return valuesObject ? str.replace(/\{(\w+)\}/g, (match, key) => {
				return valuesObject[key] || match;
			}) : str;
		}
	}

	return { t };
}
