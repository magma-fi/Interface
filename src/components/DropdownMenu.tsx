/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { OptionItem } from "../libs/types";
import { useLang } from "../hooks/useLang";

let dropdownMenuTimer: NodeJS.Timeout | null = null;

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
	const [expanded, setExpanded] = useState(false);

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

	const clearTimer = () => {
		if (dropdownMenuTimer) {
			clearTimeout(dropdownMenuTimer!);
			dropdownMenuTimer = null;
		}
	};

	const setTimer = useCallback(() => {
		if (expanded) {
			dropdownMenuTimer = setTimeout(() => {
				setExpanded(false);
			}, 1000);
		}
	}, [expanded]);

	const handleMouseEnter = () => {
		clearTimer();
	};

	const handleMouseLeave = () => {
		setTimer();
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
			{expanded && <div
				className="dropdownMenuOptions"
				onMouseLeave={handleMouseLeave}
				onMouseEnter={handleMouseEnter}
				style={{
					top: "auto",
					bottom: "0",
					right: "0",
					left: "auto"
				}}>
				{options.map((option, index) => {
					return <div
						key={option.title || option.key}
						id={String(index)}
						className={"option" + (idx === index ? " active" : "")}
						onClick={handleClickOption}>
						{option.icon && <img src={option.icon} />}

						<div>{option.title ?? t(option.key!)}</div>
					</div>
				})}
			</div>}
		</div>
	</div>
}