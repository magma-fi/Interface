import { Signer, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { BLUSDLPZap, BLUSDLPZapInterface } from "../BLUSDLPZap";
declare type BLUSDLPZapConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class BLUSDLPZap__factory extends ContractFactory {
    constructor(...args: BLUSDLPZapConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<BLUSDLPZap>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): BLUSDLPZap;
    connect(signer: Signer): BLUSDLPZap__factory;
    static readonly bytecode = "0x608060405234801561001057600080fd5b50611e7a806100206000396000f3fe608060405234801561001057600080fd5b50600436106100f45760003560e01c8063633c37c311610097578063bccb587011610066578063bccb58701461022c578063c2c00fda14610247578063eb152e6e14610262578063ef6f658c1461027557600080fd5b8063633c37c3146101d8578063846d22c0146101eb5780638eb4b19c146101fe578063b83f91a21461021157600080fd5b80633792dcb9116100d35780633792dcb9146101615780633b567faa1461017c5780633c73baa41461018f578063422f1043146101b757600080fd5b806211732f146100f957806326064dd81461010e5780632746b7f814610146575b600080fd5b61010c610107366004611c53565b610288565b005b61012973da0dd1798be66e17d5ab1dc476302b56689c2db481565b6040516001600160a01b0390911681526020015b60405180910390f35b61012973ed279fdd11ca84beef15af5d39bb4d4bee23f0ca81565b61012973b9d7dddca9a4ac480991865efef82e01273f79c381565b61010c61018a366004611c75565b6105f4565b6101a261019d366004611ca1565b610c21565b6040805192835260208301919091520161013d565b6101ca6101c5366004611c75565b610eaa565b60405190815260200161013d565b6101ca6101e6366004611ca1565b610ef8565b6101ca6101f9366004611c53565b610ffd565b6101ca61020c366004611ca1565b6111c4565b610129735f98805a4e8be255a32880fdec7f6728c6568ba081565b6101297374ed5d42203806c8cdcf2f04ca5f60dc777b901c81565b610129735ca0313d44551e32e0d7a298ec024321c4bc59b481565b6101ca610270366004611c75565b611242565b61010c610283366004611c53565b611388565b6040516323b872dd60e01b815233600482015230602482015260448101839052735ca0313d44551e32e0d7a298ec024321c4bc59b4906323b872dd906064016020604051808303816000875af11580156102e6573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061030a9190611cba565b506040516370a0823160e01b815230600482015260009073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa15801561035d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103819190611cdc565b60405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c600482015260248101859052909150735ca0313d44551e32e0d7a298ec024321c4bc59b49063095ea7b3906044016020604051808303816000875af11580156103f0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104149190611cba565b506040516307329bcd60e01b8152600481018490526000602482018190526044820184905260648201523060848201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c906307329bcd9060a401600060405180830381600087803b15801561047d57600080fd5b505af1158015610491573d6000803e3d6000fd5b50506040516370a0823160e01b81523060048201526000925083915073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa1580156104e9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061050d9190611cdc565b6105179190611d0b565b9050801561059d5760405163a9059cbb60e01b81523360048201526024810182905273b9d7dddca9a4ac480991865efef82e01273f79c39063a9059cbb906044016020604051808303816000875af1158015610577573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061059b9190611cba565b505b604080518181526005818301526410931554d160da1b606082015260208101839052905133917f5e094b77cad7cd2c8a3dfaa0bd30993fb0c210be7af7ef617aee8927f8075796919081900360800190a250505050565b6040516323b872dd60e01b815233600482015230602482015260448101849052735ca0313d44551e32e0d7a298ec024321c4bc59b4906323b872dd906064016020604051808303816000875af1158015610652573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106769190611cba565b506040516370a0823160e01b815230600482015260009073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa1580156106c9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106ed9190611cdc565b6040516370a0823160e01b815230600482015290915060009073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa158015610742573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107669190611cdc565b6040516370a0823160e01b8152306004820152909150600090735f98805a4e8be255a32880fdec7f6728c6568ba0906370a0823190602401602060405180830381865afa1580156107bb573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107df9190611cdc565b60405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c600482015260248101889052909150735ca0313d44551e32e0d7a298ec024321c4bc59b49063095ea7b3906044016020604051808303816000875af115801561084e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108729190611cba565b506040805180820182528681526000602082018190529151630c04742560e11b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c92631808e84a926108c1928b92903090600401611d47565b600060405180830381600087803b1580156108db57600080fd5b505af11580156108ef573d6000803e3d6000fd5b50506040516370a0823160e01b81523060048201526000925084915073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa158015610947573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061096b9190611cdc565b6109759190611d0b565b6040516370a0823160e01b8152306004820152909150600090859073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa1580156109cc573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109f09190611cdc565b6109fa9190611d0b565b90508015610a805760405163081579a560e01b815260048101829052600060248201526044810187905233606482015273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063081579a590608401600060405180830381600087803b158015610a6357600080fd5b505af1158015610a77573d6000803e3d6000fd5b50505050610ad3565b8515610ad35760405162461bcd60e51b815260206004820152601b60248201527f4d696e204c55534420616d6f756e74206e6f742072656163686564000000000060448201526064015b60405180910390fd5b6040516370a0823160e01b81523360048201526000908490735f98805a4e8be255a32880fdec7f6728c6568ba0906370a0823190602401602060405180830381865afa158015610b27573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b4b9190611cdc565b610b559190611d0b565b90508215610bdb5760405163a9059cbb60e01b81523360048201526024810184905273b9d7dddca9a4ac480991865efef82e01273f79c39063a9059cbb906044016020604051808303816000875af1158015610bb5573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bd99190611cba565b505b604080518481526020810183905233917f0172d048ed373e76d83e3e1680e9163745c789600f4b9c87e8b57ace3edca2d7910160405180910390a2505050505050505050565b600080735ca0313d44551e32e0d7a298ec024321c4bc59b46001600160a01b03166318160ddd6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610c76573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c9a9190611cdc565b604051634903b0d160e01b8152600060048201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634903b0d190602401602060405180830381865afa158015610cea573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610d0e9190611cdc565b610d189085611d7b565b610d229190611d9a565b91506000735ca0313d44551e32e0d7a298ec024321c4bc59b46001600160a01b03166318160ddd6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610d78573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610d9c9190611cdc565b604051634903b0d160e01b8152600160048201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634903b0d190602401602060405180830381865afa158015610dec573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e109190611cdc565b610e1a9086611d7b565b610e249190611d9a565b60405163cc2b27d760e01b8152600481018290526000602482015290915073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063cc2b27d790604401602060405180830381865afa158015610e7e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ea29190611cdc565b915050915091565b6000610eb8848484336117ed565b60405181815290915033907f2a4248f137518c1666df69294aa14c0242bc3c9ae3c040a423bfcea58c9816a7906020015b60405180910390a29392505050565b6040516327d8462f60e11b8152600481018290526001602482015260009081907374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634fb08c5e90604401602060405180830381865afa158015610f54573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f789190611cdc565b60405163cc2b27d760e01b8152600481018290526000602482015290915073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063cc2b27d790604401602060405180830381865afa158015610fd2573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ff69190611cdc565b9392505050565b60008082156111315760408051808201825284815260006020820152905163ed8e84f360e01b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9163ed8e84f3916110519190600190600401611dbc565b602060405180830381865afa15801561106e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110929190611cdc565b90506402540be40073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca6001600160a01b031663ddca3f436040518163ffffffff1660e01b8152600401602060405180830381865afa1580156110ec573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111109190611cdc565b61111a9083611d7b565b6111249190611d9a565b61112e9082611d0b565b90505b604080518082018252858152602081018390529051638d8ea72760e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c91638d8ea727916111799190600401611dd9565b602060405180830381865afa158015611196573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111ba9190611cdc565b9150505b92915050565b6040516327d8462f60e11b815260048101829052600060248201819052907374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634fb08c5e90604401602060405180830381865afa15801561121e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111be9190611cdc565b6000611250848484306117ed565b60405163095ea7b360e01b815273da0dd1798be66e17d5ab1dc476302b56689c2db4600482015260248101829052909150735ca0313d44551e32e0d7a298ec024321c4bc59b49063095ea7b3906044016020604051808303816000875af11580156112bf573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112e39190611cba565b506040516383df674760e01b8152600481018290523360248201526000604482015273da0dd1798be66e17d5ab1dc476302b56689c2db4906383df674790606401600060405180830381600087803b15801561133e57600080fd5b505af1158015611352573d6000803e3d6000fd5b50506040518381523392507f2a4248f137518c1666df69294aa14c0242bc3c9ae3c040a423bfcea58c9816a79150602001610ee9565b6040516323b872dd60e01b815233600482015230602482015260448101839052735ca0313d44551e32e0d7a298ec024321c4bc59b4906323b872dd906064016020604051808303816000875af11580156113e6573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061140a9190611cba565b506040516370a0823160e01b815230600482015260009073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa15801561145d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114819190611cdc565b6040516370a0823160e01b8152306004820152909150600090735f98805a4e8be255a32880fdec7f6728c6568ba0906370a0823190602401602060405180830381865afa1580156114d6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114fa9190611cdc565b60405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c600482015260248101869052909150735ca0313d44551e32e0d7a298ec024321c4bc59b49063095ea7b3906044016020604051808303816000875af1158015611569573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061158d9190611cba565b506040516307329bcd60e01b8152600481018590526001602482015260006044820181905260648201523060848201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c906307329bcd9060a401600060405180830381600087803b1580156115f657600080fd5b505af115801561160a573d6000803e3d6000fd5b50506040516370a0823160e01b815230600482015273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca925063081579a59150849083906370a0823190602401602060405180830381865afa158015611667573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061168b9190611cdc565b6116959190611d0b565b6040517fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16815260048101919091526000602482015260448101869052336064820152608401600060405180830381600087803b1580156116fa57600080fd5b505af115801561170e573d6000803e3d6000fd5b50506040516370a0823160e01b815233600482015260009250839150735f98805a4e8be255a32880fdec7f6728c6568ba0906370a0823190602401602060405180830381865afa158015611766573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061178a9190611cdc565b6117949190611d0b565b6040805181815260048183015263131554d160e21b606082015260208101839052905191925033917f5e094b77cad7cd2c8a3dfaa0bd30993fb0c210be7af7ef617aee8927f80757969181900360800190a25050505050565b6000808511806117fd5750600084115b61185b5760405162461bcd60e51b815260206004820152602960248201527f424c5553444c505a61703a2043616e6e6f742070726f76696465207a65726f206044820152686c697175696469747960b81b6064820152608401610aca565b60008415611a0b576040516323b872dd60e01b815233600482015230602482015260448101869052735f98805a4e8be255a32880fdec7f6728c6568ba0906323b872dd906064016020604051808303816000875af11580156118c1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906118e59190611cba565b5060405163095ea7b360e01b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca600482015260248101869052735f98805a4e8be255a32880fdec7f6728c6568ba09063095ea7b3906044016020604051808303816000875af1158015611952573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906119769190611cba565b50604080518082018252868152600060208201819052915163030f92d560e21b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca92630c3e4b54926119c5929091903090600401611de7565b6020604051808303816000875af11580156119e4573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a089190611cdc565b90505b6040516323b872dd60e01b81523360048201523060248201526044810187905273b9d7dddca9a4ac480991865efef82e01273f79c3906323b872dd906064016020604051808303816000875af1158015611a69573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611a8d9190611cba565b5060405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c60048201526024810187905273b9d7dddca9a4ac480991865efef82e01273f79c39063095ea7b3906044016020604051808303816000875af1158015611afa573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611b1e9190611cba565b508015611bb75760405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c60048201526024810182905273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063095ea7b3906044016020604051808303816000875af1158015611b91573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611bb59190611cba565b505b604080518082018252878152602081018390529051637328333b60e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c91637328333b91611c06919088906000908990600401611e12565b6020604051808303816000875af1158015611c25573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611c499190611cdc565b9695505050505050565b60008060408385031215611c6657600080fd5b50508035926020909101359150565b600080600060608486031215611c8a57600080fd5b505081359360208301359350604090920135919050565b600060208284031215611cb357600080fd5b5035919050565b600060208284031215611ccc57600080fd5b81518015158114610ff657600080fd5b600060208284031215611cee57600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b818103818111156111be576111be611cf5565b8060005b6002811015611d41578151845260209384019390910190600101611d22565b50505050565b84815260a08101611d5b6020830186611d1e565b83151560608301526001600160a01b038316608083015295945050505050565b6000816000190483118215151615611d9557611d95611cf5565b500290565b600082611db757634e487b7160e01b600052601260045260246000fd5b500490565b60608101611dca8285611d1e565b82151560408301529392505050565b604081016111be8284611d1e565b60808101611df58286611d1e565b8360408301526001600160a01b0383166060830152949350505050565b60a08101611e208287611d1e565b604082019490945291151560608301526001600160a01b031660809091015291905056fea26469706673582212201344bc9993768ef0d26896c6a976ef404eadfe77ef8b2b5ab065d32762ff635364736f6c63430008100033";
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): BLUSDLPZapInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): BLUSDLPZap;
}
export {};
