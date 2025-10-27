import { useState } from 'react';
import { Header } from './Header';
import { SecretSubmit } from './SecretSubmit';
import { SecretList } from './SecretList';
import '../styles/KeepSecretApp.css';

export function KeepSecretApp() {
  const [activeTab, setActiveTab] = useState<'store' | 'list'>('store');

  return (
    <div className="app-container">
      <Header />
      <div className="app-card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            Store Secret
          </button>
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            My Secrets
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'store' && <SecretSubmit />}
          {activeTab === 'list' && <SecretList />}
        </div>
      </div>
    </div>
  );
}

