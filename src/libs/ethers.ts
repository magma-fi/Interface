import * as React from 'react'
import { type PublicClient, usePublicClient } from 'wagmi'
import { FallbackProvider, JsonRpcProvider } from '@ethersproject/providers'
import { type HttpTransport } from 'viem'

export function publicClientToProvider(publicClient: PublicClient) {
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

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
	const publicClient = usePublicClient({ chainId })
	return React.useMemo(() => publicClientToProvider(publicClient), [publicClient])
}
