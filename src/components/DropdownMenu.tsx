/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { MouseEvent, ReactNode, useState } from "react";
import { OptionItem } from "../libs/types";
import { useLang } from "../hooks/useLang";

export const DropdownMenu = ({
	defaultValue = 0,
	options = [],
	onChange = () => { },
	children = null
}: {
	defaultValue?: number;
	options: OptionItem[];
	onChange: (idx: number) => void;
	children: ReactNode;
}) => {
	const { t } = useLang();
	const [idx, setIdx] = useState(defaultValue);
	const currentOption = options[idx];
	const [expanded, setExpanded] = useState(false)

	const handleExpand = () => {
		if (options.length >= 1) {
			setExpanded(!expanded);
		}
	};

	const handleClickOption = (evt: MouseEvent) => {
		const val = parseInt(evt.currentTarget.id);
		setIdx(val);
		onChange(val);
		setExpanded(false);
	};

	return <div>
		<div
			className="dropdownMenu"
			onClick={handleExpand}>
			{children}

			{!children && <>
				{currentOption.icon && <div
					className="icon"
					style={{ backgroundImage: "url(" + currentOption.icon + ")" }} />}

				<div>{currentOption.title ?? t(currentOption.key!)}</div>

				{options.length > 2 && (!expanded ? <img
					className="arrow"
					src="images/arrow-down.png" /> : <img
					className="arrow"
					src="images/arrow-up.png" />)}
			</>}
		</div>

		<div style={{ position: "relative" }}>
			{expanded && <div className="dropdownMenuOptions">
				{options.map((option, index) => {
					return <div
						key={option.title || option.key}
						id={String(index)}
						className={"option" + (idx === index ? " active" : "")}
						onClick={handleClickOption}>
						<img src={option.icon} />

						<div>{option.title ?? t(option.key!)}</div>
					</div>
				})}
			</div>}
		</div>
	</div>
}