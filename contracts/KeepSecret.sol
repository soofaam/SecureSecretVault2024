// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title KeepSecret - Encrypted secret storage with FHE password
/// @notice Stores user-provided ciphertext (ChaCha20) and an FHE-encrypted password (address-like)
/// @dev Password is stored as FHE eaddress. Title is plaintext for listing purposes.
contract KeepSecret is SepoliaConfig {
    struct Secret {
        address owner;
        string title;
        bytes data; // ChaCha20 ciphertext (nonce || ciphertext), opaque to the contract
        eaddress encPassword; // FHE-encrypted address-shaped password
        uint64 createdAt; // unix seconds
    }

    Secret[] private _secrets;
    mapping(address => uint256[]) private _secretsOf;

    event SecretStored(uint256 indexed id, address indexed owner, string title, uint64 createdAt);

    /// @notice Store a new secret
    /// @param title A short plaintext title for listing
    /// @param data The ChaCha20 ciphertext bytes (nonce || ciphertext)
    /// @param encPwd External encrypted address input handle
    /// @param inputProof The Zama input proof for `encPwd`
    function storeSecret(
        string calldata title,
        bytes calldata data,
        externalEaddress encPwd,
        bytes calldata inputProof
    ) external {
        eaddress password = FHE.fromExternal(encPwd, inputProof);

        Secret memory s;
        s.owner = msg.sender;
        s.title = title;
        s.data = data;
        s.encPassword = password;
        s.createdAt = uint64(block.timestamp);

        // Persist and index
        _secrets.push(s);
        uint256 id = _secrets.length - 1;
        _secretsOf[msg.sender].push(id);

        // ACL: allow contract and user to access the encrypted password for re-encryption
        FHE.allowThis(_secrets[id].encPassword);
        FHE.allow(_secrets[id].encPassword, msg.sender);

        emit SecretStored(id, msg.sender, title, s.createdAt);
    }

    /// @notice Get secret count for an owner
    /// @param owner The address to query for
    /// @return count Number of secrets
    function getSecretCountByOwner(address owner) external view returns (uint256 count) {
        return _secretsOf[owner].length;
    }

    /// @notice Get secret ids for an owner
    /// @param owner The address to query for
    /// @return ids Array of secret ids
    function getSecretIdsByOwner(address owner) external view returns (uint256[] memory ids) {
        return _secretsOf[owner];
    }

    /// @notice Get metadata for a secret id
    /// @param id The secret id
    /// @return owner Owner address
    /// @return title Title string
    /// @return createdAt Timestamp (seconds)
    function getSecretMeta(uint256 id)
        external
        view
        returns (address owner, string memory title, uint64 createdAt)
    {
        Secret storage s = _secrets[id];
        return (s.owner, s.title, s.createdAt);
    }

    /// @notice Get the ciphertext bytes for a secret id
    /// @param id The secret id
    /// @return data The ChaCha20 ciphertext bytes
    function getSecretData(uint256 id) external view returns (bytes memory data) {
        return _secrets[id].data;
    }

    /// @notice Get the encrypted password for a secret id
    /// @param id The secret id
    /// @return encPassword The FHE-encrypted address-shaped password
    function getEncryptedPassword(uint256 id) external view returns (eaddress encPassword) {
        return _secrets[id].encPassword;
    }
}

