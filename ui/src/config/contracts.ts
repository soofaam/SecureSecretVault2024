// KeepSecret contract deployed on Sepolia
export const CONTRACT_ADDRESS = '0x1410D4B99c35Bf80ED56D0f0A54F226BE38F5008';

// ABI copied from deployments/sepolia/KeepSecret.json (no JSON imports in frontend)
export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
      { "indexed": false, "internalType": "uint64", "name": "createdAt", "type": "uint64" }
    ],
    "name": "SecretStored",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "getEncryptedPassword",
    "outputs": [
      { "internalType": "eaddress", "name": "encPassword", "type": "bytes32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "getSecretCountByOwner",
    "outputs": [
      { "internalType": "uint256", "name": "count", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "getSecretData",
    "outputs": [
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "getSecretIdsByOwner",
    "outputs": [
      { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "getSecretMeta",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "bytes", "name": "data", "type": "bytes" },
      { "internalType": "externalEaddress", "name": "encPwd", "type": "bytes32" },
      { "internalType": "bytes", "name": "inputProof", "type": "bytes" }
    ],
    "name": "storeSecret",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
