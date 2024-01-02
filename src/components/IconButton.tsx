/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";

export const IconButton = ({
	icon = "",
	iconHover = "",
	iconActive = "",
	onClick = () => { }
}) => {
	const handleMouseEnter = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (iconHover)
			evt.currentTarget.style.backgroundImage = iconHover;
	};

	const handleMouseOut = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (icon)
			evt.currentTarget.style.backgroundImage = icon;
	};

	const handleMouseDown = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (iconActive)
			evt.currentTarget.style.backgroundImage = iconActive;
	};

	return <button
		className="iconButton"
		onMouseEnter={handleMouseEnter}
		onMouseOut={handleMouseOut}
		onMouseDown={handleMouseDown}
		onClick={onClick}>
		<img src={icon} />
	</button>
};