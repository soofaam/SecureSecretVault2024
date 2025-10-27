import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { chacha20Decrypt } from '../utils/chacha20';
import { hexToBytes, bytesToUtf8 } from '../utils/bytes';
import { keccak256, toUtf8Bytes } from 'ethers';
import '../styles/SecretList.css';

function deriveKeyFromPasswordAddress(passwordAddress: string): Uint8Array {
  const hash = keccak256(toUtf8Bytes(passwordAddress.toLowerCase()));
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = parseInt(hash.slice(2 + i * 2, 4 + i * 2), 16);
  return key;
}

export function SecretList() {
  const { address } = useAccount();

  const { data: ids } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getSecretIdsByOwner',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const secretIds: bigint[] = useMemo(() => (Array.isArray(ids) ? ids as bigint[] : []), [ids]);

  if (!address) {
    return <div className="list-info">Connect your wallet to view your secrets.</div>;
  }

  if (!secretIds.length) {
    return <div className="list-info">No secrets yet. Store one in the Store Secret tab.</div>;
  }

  return (
    <div className="secret-list">
      {secretIds.map((id) => (
        <SecretItem key={id.toString()} id={id} />
      ))}
    </div>
  );
}

function SecretItem({ id }: { id: bigint }) {
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();
  const { address } = useAccount();

  const { data: meta } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getSecretMeta',
    args: [id],
  });

  const { data: encPwdHandle } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedPassword',
    args: [id],
  });

  const { data: dataBytes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getSecretData',
    args: [id],
  });

  const [decrypted, setDecrypted] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const title = meta ? (meta as any)[1] as string : '';
  const createdAt = meta ? new Date(Number((meta as any)[2]) * 1000).toLocaleString() : '';

  const decrypt = async () => {
    if (!instance || !address || !signer) {
      alert('Missing wallet or encryption instance');
      return;
    }
    if (!encPwdHandle || !dataBytes) {
      alert('Missing on-chain data');
      return;
    }
    setBusy(true);
    try {
      // 1) Use hook-fetched on-chain values
      const encHandle = encPwdHandle as string; // bytes32 handle
      const ciphertextHex = dataBytes as `0x${string}`;

      // 2) Request user decryption of password (address)
      const keypair = instance.generateKeypair();
      const handleContractPairs = [ { handle: encHandle, contractAddress: CONTRACT_ADDRESS } ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contractAddresses = [CONTRACT_ADDRESS];
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
      const s = await signer;
      const signature = await s.signTypedData(eip712.domain, { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification }, eip712.message);

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x',''),
        contractAddresses,
        s.address,
        startTimeStamp,
        durationDays,
      );

      const passwordAddress = result[encHandle] as string; // e.g., 0xABCD...
      if (!passwordAddress || !passwordAddress.startsWith('0x')) throw new Error('Invalid decrypted password');

      // 3) Decrypt with ChaCha20
      const allBytes = hexToBytes(ciphertextHex);
      const nonce = allBytes.slice(0, 12);
      const ct = allBytes.slice(12);
      const key = deriveKeyFromPasswordAddress(passwordAddress);
      const pt = chacha20Decrypt(key, nonce, ct);
      const text = bytesToUtf8(pt);
      setDecrypted(text);
    } catch (err: any) {
      console.error('Decrypt failed', err);
      alert('Decrypt failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="secret-item">
      <div className="meta">
        <div className="meta-title">{title || 'Untitled'}</div>
        <div className="meta-time">{createdAt}</div>
      </div>
      {!decrypted ? (
        <button className="decrypt-btn" onClick={decrypt} disabled={busy || !instance || !signer}>
          {busy ? 'Decrypting...' : 'Decrypt'}
        </button>
      ) : (
        <div className="decrypted-box">
          <div className="decrypted-title">Decrypted Secret</div>
          <div className="decrypted-text">{decrypted}</div>
          <button className="decrypt-btn" onClick={() => setDecrypted('')}>Hide</button>
        </div>
      )}
    </div>
  );
}
