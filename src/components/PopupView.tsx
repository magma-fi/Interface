/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ReactElement, ReactNode, useCallback, useState } from "react";

let dropdownMenuTimer: NodeJS.Timeout | null = null;

export const PopupView = ({
	entryView = null,
	showArrows = false,
	alignTop = false,
	popupView = <></>,
	forcedClass = ""
}: {
	entryView: ReactNode;
	showArrows: boolean;
	alignTop: boolean;
	popupView: ReactElement;
	forcedClass: string;
}) => {
	const [expanded, setExpanded] = useState(false);

	const handleExpand = () => {
		setExpanded(!expanded);
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

	const renderArrows = !expanded ? <img
		className="arrow"
		src="images/arrow-down.png" /> : <img
		className="arrow"
		src="images/arrow-up.png" />

	return <div>
		<div
			className={forcedClass ?? "dropdownMenu"}
			onClick={handleExpand}>
			{entryView && <>
				{entryView}
				{showArrows && renderArrows}
			</>}
		</div>

		<div style={{ position: "relative" }}>
			{expanded && <div
				className="dropdownMenuOptions"
				onMouseLeave={handleMouseLeave}
				onMouseEnter={handleMouseEnter}
				style={{
					top: alignTop ? "0" : "auto",
					bottom: alignTop ? "auto" : "0",
					right: "0",
					left: "auto"
				}}>
				{popupView}
			</div>}
		</div>
	</div>
}