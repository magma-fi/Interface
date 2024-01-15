import * as React from 'react'
import { type PublicClient, usePublicClient, WalletClient, useWalletClient } from 'wagmi'
import { FallbackProvider, JsonRpcProvider } from '@ethersproject/providers'
import { type HttpTransport } from 'viem'
import { Config, getConnectorClient } from '@wagmi/core'
import { providers } from 'ethers'
import type { Account, Chain, Client, Transport } from 'viem'

function publicClientToProvider(publicClient: PublicClient) {
	const { chain, transport } = publicClient
	const network = {
		chainId: chain.id,
		name: chain.name,
		ensAddress: chain.contracts?.ensRegistry?.address,
	}
	if (transport.type === 'fallback')
		return new FallbackProvider(
			(transport.transports as ReturnType<HttpTransport>[]).map(
				({ value }) => new JsonRpcProvider(value?.url, network),
			),
		)
	return new JsonRpcProvider(transport.url, network)
}

function clientToSigner(client: WalletClient) {
	const { account, chain, transport } = client
	const network = {
		chainId: chain.id,
		name: chain.name,
		ensAddress: chain.contracts?.ensRegistry?.address,
	}
	const provider = new providers.Web3Provider(transport, network)
	const signer = provider.getSigner(account.address)
	return signer
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
	const publicClient = usePublicClient({ chainId })
	return React.useMemo(() => publicClientToProvider(publicClient), [publicClient])
}

export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
	const walletClient = useWalletClient({ chainId })
	return React.useMemo(() => {
		if (walletClient?.data) {
			return clientToSigner(walletClient.data as WalletClient);
		}
	}, [walletClient])
}
