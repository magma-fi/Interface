import { StyleModeOptions } from "../libs/globalContants"
import { DropdownMenu } from "./DropdownMenu"

export const StyleModeSelect = () => {
	const handleChangeStyleMode = (idx: number) => {
		// 
	}

	return <DropdownMenu
		defaultValue={0}
		options={StyleModeOptions}
		onChange={handleChangeStyleMode} />
}