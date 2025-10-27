import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { keccak256, toUtf8Bytes } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { chacha20Encrypt } from '../utils/chacha20';
import { utf8ToBytes, bytesToHex, randomBytes, concatBytes } from '../utils/bytes';
import '../styles/SecretSubmit.css';
import { FHEIntro } from './FHEIntro';

function deriveKeyFromPasswordAddress(passwordAddress: string): Uint8Array {
  const hash = keccak256(toUtf8Bytes(passwordAddress.toLowerCase()));
  // keccak256 returns 0x + 32 bytes
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = parseInt(hash.slice(2 + i * 2, 4 + i * 2), 16);
  return key;
}

function generateRandomAddress(): string {
  const bytes = randomBytes(20);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SecretSubmit() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [title, setTitle] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [successId, setSuccessId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instance || !address || !signerPromise) {
      alert('Missing wallet or encryption instance');
      return;
    }
    if (!title.trim() || !plaintext.trim()) {
      alert('Please enter both title and secret message');
      return;
    }

    setIsSubmitting(true);
    setSuccessId('');

    try {
      // 1) Generate password (address-like), derive 32-byte key, random 12-byte nonce
      const password = generateRandomAddress();
      setGeneratedPassword(password);
      const key = deriveKeyFromPasswordAddress(password);
      const nonce = randomBytes(12);

      // 2) Encrypt the plaintext using ChaCha20 (nonce || ciphertext)
      const ptBytes = utf8ToBytes(plaintext);
      const ct = chacha20Encrypt(key, nonce, ptBytes);
      const data = concatBytes(nonce, ct);

      // 3) Prepare Zama encrypted input (password as address type)
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.addAddress(password);
      const encryptedInput = await input.encrypt();

      // 4) Submit on-chain using ethers for writes
      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setIsConfirming(true);
      const tx = await contract.storeSecret(
        title,
        bytesToHex(data),
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();
      setSuccessId('Stored successfully');

    } catch (err) {
      console.error(err);
      alert('Failed to store secret');
    } finally {
      setIsConfirming(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="secret-submit-container">
      <div className="secret-submit-card">
        <FHEIntro />
        <h2 className="title">Store Encrypted Secret</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="label">Title</label>
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title for your secret"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Secret Text</label>
            <textarea
              className="textarea"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Enter the text you want to encrypt"
              required
              rows={6}
            />
          </div>
          <button className="button" type="submit" disabled={!address || zamaLoading || isSubmitting || isConfirming}>
            {zamaLoading ? 'Initializing encryption...' : isSubmitting ? 'Encrypting...' : isConfirming ? 'Confirming...' : 'Store Secret'}
          </button>
        </form>

        {generatedPassword && (
          <div className="info">
            <div className="info-title">Message FHE encrypted success!</div>
            {/* <code className="code">{generatedPassword}</code> */}
            <p className="hint">Waiting send to chain...</p>
          </div>
        )}

        {successId && (
          <div className="success">
            ✅ {successId}
          </div>
        )}
      </div>
    </div>
  );
}
