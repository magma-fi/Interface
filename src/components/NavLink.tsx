type NavLinkProps = {
	icon: string;
	label: string;
	url: string;
	fullWidth: boolean;
	showExternalLink: boolean;
	active: boolean;
};

export function NavLink({
	icon = "",
	label = "",
	url = "#",
	fullWidth = true,
	showExternalLink = true,
	active = false
}: NavLinkProps) {
	return <a
		className={"navLink" + (active ? " active" : "")}
		href={url}
		style={{ width: fullWidth ? "calc(100% - 32px)" : "fit-content" }}>
		{icon && <img src={icon} />}

		{label}

		{showExternalLink && <img src="images/external-link.png" />}
	</a>
}