/* eslint-disable @typescript-eslint/no-empty-function */
import { Modal } from "../components/Modal";

export const TermsModal = ({
	isOpen = false,
	onClose = () => { }
}) => {
	return isOpen ? <Modal
		title="Website Terms of Use"
		onClose={onClose}>
		<div
			className="depositModal"
			style={{
				flexDirection: "column",
				maxHeight: "60vh",
				overflowX: "hidden",
				overflowY: "scroll"
			}}>
			<h3>1. Audit Report</h3>
			<p>We are pleased to inform you that the initial audit of the Magma Protocol has been completed. To date, no high-risk issues have been identified. Please note that the final audit report has not yet been released, and we advise users to stay informed about the latest audit information.</p>
			<h3>2. Testing Phase Statement</h3>
			<p>Magma is currently in an early testing stage. We strongly recommend that users participate with only a small amount of funds. Before participating, please ensure that you understand all risks associated with this and that your participation is voluntary.</p>
			<h3>3. Smart Contract Risks</h3>
			<p>Before using this website, please carefully understand the potential risks of smart contracts in Decentralized Finance (DeFi). Magma is not responsible for any direct or indirect losses incurred due to the use of or reliance on any transactions conducted through smart contracts.</p>
			<h3>4. Security Warning</h3>
			<p>No member of the Magma Team will ever ask you for your seed phrase or directly request funds. Please remain vigilant and protect your account security. Remember, you are your own best protector.</p>
			<h3>5. Disclaimer</h3>
			<p>The content on this website is for reference only and does not constitute investment advice. Magma and its team members are not liable for any losses or damages incurred due to the use of or reliance on the content of this website.</p>
			<h3>6. Changes to Terms</h3>
			<p>Magma reserves the right to modify these terms of use at any time. Any changes will be posted on this website and will be effective from the date of posting.</p>
		</div>
	</Modal> : <></>
};