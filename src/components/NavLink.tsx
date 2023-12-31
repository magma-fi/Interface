import { Link } from "react-router-dom";

type NavLinkProps = {
	icon: string;
	label: string;
	url: string;
	fullWidth: boolean;
	showExternalLink: boolean;
	active: boolean;
	target: string;
};

export function NavLink({
	icon = "",
	label = "",
	url = "#",
	fullWidth = true,
	showExternalLink = true,
	active = false,
	target = "_self"
}: NavLinkProps) {
	return <Link
		className={"navLink" + (active ? " active" : "") + (fullWidth ? " navLink-fullWidth" : "")}
		to={url}
		target={target}>
		{icon && <img src={icon} />}

		{label}

		{showExternalLink && <img
			id="externalLink"
			src="images/external-link.png" />}
	</Link>
}