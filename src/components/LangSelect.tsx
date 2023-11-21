import { appController } from "../libs/appController"
import { LangOptions, Langs } from "../libs/globalContants"
import { DropdownMenu } from "./DropdownMenu"

export const LangSelect = () => {
	const handleChangeLang = (idx: number) => {
		appController.changeLang(LangOptions[idx].title as Langs);
		appController.relaunch();
	}

	return <DropdownMenu
		defaultValue={LangOptions.findIndex(item => item.title === appController.lang)}
		options={LangOptions}
		onChange={handleChangeLang} />
}