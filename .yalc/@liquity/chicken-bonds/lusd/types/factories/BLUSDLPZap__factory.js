"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLUSDLPZap__factory = void 0;
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
const ethers_1 = require("ethers");
const _abi = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_bLUSDAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_lusdAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_minLPTokens",
                type: "uint256",
            },
        ],
        name: "addLiquidity",
        outputs: [
            {
                internalType: "uint256",
                name: "bLUSDLUSD3CRVTokens",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_bLUSDAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_lusdAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_minLPTokens",
                type: "uint256",
            },
        ],
        name: "addLiquidityAndStake",
        outputs: [
            {
                internalType: "uint256",
                name: "bLUSDLUSD3CRVTokens",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "bLUSDGauge",
        outputs: [
            {
                internalType: "contract ICurveLiquidityGaugeV5",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bLUSDLUSD3CRVLPToken",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bLUSDLUSD3CRVPool",
        outputs: [
            {
                internalType: "contract ICurveCryptoPool",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "bLUSDToken",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_bLUSDAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_lusdAmount",
                type: "uint256",
            },
        ],
        name: "getMinLPTokens",
        outputs: [
            {
                internalType: "uint256",
                name: "bLUSDLUSD3CRVTokens",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_lpAmount",
                type: "uint256",
            },
        ],
        name: "getMinWithdrawBalanced",
        outputs: [
            {
                internalType: "uint256",
                name: "bLUSDAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "lusdAmount",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_lpAmount",
                type: "uint256",
            },
        ],
        name: "getMinWithdrawLUSD",
        outputs: [
            {
                internalType: "uint256",
                name: "lusdAmount",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "lusd3CRVPool",
        outputs: [
            {
                internalType: "contract ICurvePool",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "lusdToken",
        outputs: [
            {
                internalType: "contract IERC20",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_lpAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_minBLUSD",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_minLUSD",
                type: "uint256",
            },
        ],
        name: "removeLiquidityBalanced",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "_lpAmount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_minLUSD",
                type: "uint256",
            },
        ],
        name: "removeLiquidityLUSD",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b50611640806100206000396000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c8063633c37c31161008c578063bccb587011610066578063bccb5870146101f1578063c2c00fda1461020c578063eb152e6e14610227578063ef6f658c1461023a57600080fd5b8063633c37c3146101b0578063846d22c0146101c3578063b83f91a2146101d657600080fd5b80633b567faa116100bd5780633b567faa146101525780633c73baa414610167578063422f10431461018f57600080fd5b806326064dd8146100e45780632746b7f81461011c5780633792dcb914610137575b600080fd5b6100ff73da0dd1798be66e17d5ab1dc476302b56689c2db481565b6040516001600160a01b0390911681526020015b60405180910390f35b6100ff73ed279fdd11ca84beef15af5d39bb4d4bee23f0ca81565b6100ff73b9d7dddca9a4ac480991865efef82e01273f79c381565b610165610160366004611419565b61024d565b005b61017a610175366004611445565b6106b1565b60408051928352602083019190915201610113565b6101a261019d366004611419565b61093a565b604051908152602001610113565b6101a26101be366004611445565b610950565b6101a26101d136600461145e565b610a55565b6100ff735f98805a4e8be255a32880fdec7f6728c6568ba081565b6100ff7374ed5d42203806c8cdcf2f04ca5f60dc777b901c81565b6100ff735ca0313d44551e32e0d7a298ec024321c4bc59b481565b6101a2610235366004611419565b610c1c565b61016561024836600461145e565b610d37565b6040516323b872dd60e01b815233600482015230602482015260448101849052735ca0313d44551e32e0d7a298ec024321c4bc59b4906323b872dd906064016020604051808303816000875af11580156102ab573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102cf9190611480565b506040516370a0823160e01b815230600482015260009073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa158015610322573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061034691906114a2565b6040516370a0823160e01b815230600482015290915060009073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa15801561039b573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103bf91906114a2565b6040805180820182528681526000602082018190529151630c04742560e11b81529293507374ed5d42203806c8cdcf2f04ca5f60dc777b901c92631808e84a92610412928a9290919030906004016114e4565b600060405180830381600087803b15801561042c57600080fd5b505af1158015610440573d6000803e3d6000fd5b50506040516370a0823160e01b81523060048201526000925083915073b9d7dddca9a4ac480991865efef82e01273f79c3906370a0823190602401602060405180830381865afa158015610498573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104bc91906114a2565b6104c6919061152e565b6040516370a0823160e01b8152306004820152909150600090849073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa15801561051d573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061054191906114a2565b61054b919061152e565b905080156105d15760405163081579a560e01b815260048101829052600060248201526044810186905233606482015273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063081579a590608401600060405180830381600087803b1580156105b457600080fd5b505af11580156105c8573d6000803e3d6000fd5b50505050610624565b84156106245760405162461bcd60e51b815260206004820152601b60248201527f4d696e204c55534420616d6f756e74206e6f742072656163686564000000000060448201526064015b60405180910390fd5b81156106a85760405163a9059cbb60e01b81523360048201526024810183905273b9d7dddca9a4ac480991865efef82e01273f79c39063a9059cbb906044016020604051808303816000875af1158015610682573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106a69190611480565b505b50505050505050565b600080735ca0313d44551e32e0d7a298ec024321c4bc59b46001600160a01b03166318160ddd6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610706573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061072a91906114a2565b604051634903b0d160e01b8152600060048201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634903b0d190602401602060405180830381865afa15801561077a573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061079e91906114a2565b6107a89085611541565b6107b29190611560565b91506000735ca0313d44551e32e0d7a298ec024321c4bc59b46001600160a01b03166318160ddd6040518163ffffffff1660e01b8152600401602060405180830381865afa158015610808573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061082c91906114a2565b604051634903b0d160e01b8152600160048201527374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634903b0d190602401602060405180830381865afa15801561087c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108a091906114a2565b6108aa9086611541565b6108b49190611560565b60405163cc2b27d760e01b8152600481018290526000602482015290915073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063cc2b27d790604401602060405180830381865afa15801561090e573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061093291906114a2565b915050915091565b600061094884848433610fb3565b949350505050565b6040516327d8462f60e11b8152600481018290526001602482015260009081907374ed5d42203806c8cdcf2f04ca5f60dc777b901c90634fb08c5e90604401602060405180830381865afa1580156109ac573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109d091906114a2565b60405163cc2b27d760e01b8152600481018290526000602482015290915073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063cc2b27d790604401602060405180830381865afa158015610a2a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a4e91906114a2565b9392505050565b6000808215610b895760408051808201825284815260006020820152905163ed8e84f360e01b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9163ed8e84f391610aa99190600190600401611582565b602060405180830381865afa158015610ac6573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610aea91906114a2565b90506402540be40073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca6001600160a01b031663ddca3f436040518163ffffffff1660e01b8152600401602060405180830381865afa158015610b44573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b6891906114a2565b610b729083611541565b610b7c9190611560565b610b86908261152e565b90505b604080518082018252858152602081018390529051638d8ea72760e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c91638d8ea72791610bd1919060040161159f565b602060405180830381865afa158015610bee573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c1291906114a2565b9150505b92915050565b6000610c2a84848430610fb3565b60405163095ea7b360e01b815273da0dd1798be66e17d5ab1dc476302b56689c2db4600482015260248101829052909150735ca0313d44551e32e0d7a298ec024321c4bc59b49063095ea7b3906044016020604051808303816000875af1158015610c99573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610cbd9190611480565b506040516383df674760e01b8152600481018290523360248201526000604482015273da0dd1798be66e17d5ab1dc476302b56689c2db4906383df674790606401600060405180830381600087803b158015610d1857600080fd5b505af1158015610d2c573d6000803e3d6000fd5b505050509392505050565b6040516323b872dd60e01b815233600482015230602482015260448101839052735ca0313d44551e32e0d7a298ec024321c4bc59b4906323b872dd906064016020604051808303816000875af1158015610d95573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610db99190611480565b506040516370a0823160e01b815230600482015260009073ed279fdd11ca84beef15af5d39bb4d4bee23f0ca906370a0823190602401602060405180830381865afa158015610e0c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e3091906114a2565b6040516307329bcd60e01b8152600481018590526001602482015260006044820181905260648201523060848201529091507374ed5d42203806c8cdcf2f04ca5f60dc777b901c906307329bcd9060a401600060405180830381600087803b158015610e9b57600080fd5b505af1158015610eaf573d6000803e3d6000fd5b50506040516370a0823160e01b815230600482015273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca925063081579a59150839083906370a0823190602401602060405180830381865afa158015610f0c573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f3091906114a2565b610f3a919061152e565b6040517fffffffff0000000000000000000000000000000000000000000000000000000060e084901b16815260048101919091526000602482015260448101859052336064820152608401600060405180830381600087803b158015610f9f57600080fd5b505af11580156106a8573d6000803e3d6000fd5b600080851180610fc35750600084115b6110215760405162461bcd60e51b815260206004820152602960248201527f424c5553444c505a61703a2043616e6e6f742070726f76696465207a65726f206044820152686c697175696469747960b81b606482015260840161061b565b600084156111d1576040516323b872dd60e01b815233600482015230602482015260448101869052735f98805a4e8be255a32880fdec7f6728c6568ba0906323b872dd906064016020604051808303816000875af1158015611087573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110ab9190611480565b5060405163095ea7b360e01b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca600482015260248101869052735f98805a4e8be255a32880fdec7f6728c6568ba09063095ea7b3906044016020604051808303816000875af1158015611118573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061113c9190611480565b50604080518082018252868152600060208201819052915163030f92d560e21b815273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca92630c3e4b549261118b9290919030906004016115ad565b6020604051808303816000875af11580156111aa573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111ce91906114a2565b90505b6040516323b872dd60e01b81523360048201523060248201526044810187905273b9d7dddca9a4ac480991865efef82e01273f79c3906323b872dd906064016020604051808303816000875af115801561122f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112539190611480565b5060405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c60048201526024810187905273b9d7dddca9a4ac480991865efef82e01273f79c39063095ea7b3906044016020604051808303816000875af11580156112c0573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906112e49190611480565b50801561137d5760405163095ea7b360e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c60048201526024810182905273ed279fdd11ca84beef15af5d39bb4d4bee23f0ca9063095ea7b3906044016020604051808303816000875af1158015611357573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061137b9190611480565b505b604080518082018252878152602081018390529051637328333b60e01b81527374ed5d42203806c8cdcf2f04ca5f60dc777b901c91637328333b916113cc9190889060009089906004016115d8565b6020604051808303816000875af11580156113eb573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061140f91906114a2565b9695505050505050565b60008060006060848603121561142e57600080fd5b505081359360208301359350604090920135919050565b60006020828403121561145757600080fd5b5035919050565b6000806040838503121561147157600080fd5b50508035926020909101359150565b60006020828403121561149257600080fd5b81518015158114610a4e57600080fd5b6000602082840312156114b457600080fd5b5051919050565b8060005b60028110156114de5781518452602093840193909101906001016114bf565b50505050565b84815260a081016114f860208301866114bb565b83151560608301526001600160a01b038316608083015295945050505050565b634e487b7160e01b600052601160045260246000fd5b81810381811115610c1657610c16611518565b600081600019048311821515161561155b5761155b611518565b500290565b60008261157d57634e487b7160e01b600052601260045260246000fd5b500490565b6060810161159082856114bb565b82151560408301529392505050565b60408101610c1682846114bb565b608081016115bb82866114bb565b8360408301526001600160a01b0383166060830152949350505050565b60a081016115e682876114bb565b604082019490945291151560608301526001600160a01b031660809091015291905056fea26469706673582212203fc1a4ae62dd5878755d9c510080db570adbe014715297c1b083fe2dda8cf65264736f6c63430008100033";
const isSuperArgs = (xs) => xs.length > 1;
class BLUSDLPZap__factory extends ethers_1.ContractFactory {
    constructor(...args) {
        if (isSuperArgs(args)) {
            super(...args);
        }
        else {
            super(_abi, _bytecode, args[0]);
        }
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static createInterface() {
        return new ethers_1.utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.BLUSDLPZap__factory = BLUSDLPZap__factory;
BLUSDLPZap__factory.bytecode = _bytecode;
BLUSDLPZap__factory.abi = _abi;
