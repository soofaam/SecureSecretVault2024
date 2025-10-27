import '../styles/FHEIntro.css';

export function FHEIntro() {
  return (
    <div className="fhe-intro">
      <div className="fhe-intro-header">
        <div className="fhe-icon">🔐</div>
        <h3 className="fhe-title">Fully Homomorphic Encryption</h3>
      </div>

      <div className="fhe-content">
        <p className="fhe-description">
          FHE allows computations on encrypted data without decryption, ensuring your secrets remain private throughout the entire process.
        </p>

        <div className="fhe-features">
          <div className="feature">
            <span className="feature-icon">🛡️</span>
            <span className="feature-text">End-to-end privacy</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">Compute on encrypted data</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span className="feature-text">Zero-trust architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}