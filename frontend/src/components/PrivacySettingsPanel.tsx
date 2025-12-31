/**
 * PrivacySettingsPanel: UI component for managing chat persistence and privacy
 */

import React, { useState } from 'react';
import { useChatPersistence } from '../hooks/useChatPersistence';
import './PrivacySettingsPanel.css';

interface PrivacySettingsPanelProps {
  conversationId: string;
  onSettingsChanged?: (settings: any) => void;
}

export const PrivacySettingsPanel: React.FC<PrivacySettingsPanelProps> = ({
  conversationId,
  onSettingsChanged
}) => {
  const {
    settings,
    loading,
    error,
    updateSettings,
    giveConsent,
    withdrawConsent
  } = useChatPersistence(conversationId);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings(conversationId, { [key]: value });
    onSettingsChanged?.(settings);
  };

  const handleConsent = async () => {
    await giveConsent(conversationId, 'all');
    onSettingsChanged?.(settings);
  };

  const handleWithdrawConsent = async () => {
    await withdrawConsent(conversationId);
    onSettingsChanged?.(settings);
  };

  return (
    <div className="privacy-settings-panel">
      <div className="privacy-header">
        <h3>Privacy & Data Settings</h3>
        <button
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          {showDetails ? '▼' : '▶'} Details
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-summary">
        <div className="setting-status">
          <span className={`status-badge ${settings.storeChatHistory ? 'enabled' : 'disabled'}`}>
            {settings.storeChatHistory ? '✓' : '✗'} Chat History
          </span>
          <span className={`status-badge ${settings.allowSemanticIndexing ? 'enabled' : 'disabled'}`}>
            {settings.allowSemanticIndexing ? '✓' : '✗'} Semantic Indexing
          </span>
          <span className={`status-badge ${settings.allowPIIStorage ? 'enabled' : 'disabled'}`}>
            {settings.allowPIIStorage ? '✓' : '✗'} PII Storage
          </span>
          <span className={`status-badge ${settings.userConsent ? 'enabled' : 'disabled'}`}>
            {settings.userConsent ? '✓' : '✗'} User Consent
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="settings-details">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.storeChatHistory}
                onChange={(e) => handleToggleSetting('storeChatHistory', e.target.checked)}
                disabled={loading}
              />
              <span className="setting-label">Store Chat History</span>
            </label>
            <p className="setting-description">
              Save your conversations for future reference and context.
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowSemanticIndexing}
                onChange={(e) => handleToggleSetting('allowSemanticIndexing', e.target.checked)}
                disabled={loading}
              />
              <span className="setting-label">Allow Semantic Indexing</span>
            </label>
            <p className="setting-description">
              Index your messages for intelligent recall across conversations.
            </p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowPIIStorage}
                onChange={(e) => handleToggleSetting('allowPIIStorage', e.target.checked)}
                disabled={loading}
              />
              <span className="setting-label">Allow Personal Information Storage</span>
            </label>
            <p className="setting-description">
              Store personally identifiable information (name, email, etc.) for personalization.
            </p>
          </div>

          <div className="consent-section">
            <h4>Explicit Consent</h4>
            {settings.userConsent ? (
              <div className="consent-given">
                <p>
                  ✓ You have given consent for data retention.
                  {settings.consentDate && (
                    <span className="consent-date">
                      {' '}(as of {new Date(settings.consentDate).toLocaleDateString()})
                    </span>
                  )}
                </p>
                <button
                  className="btn-secondary"
                  onClick={handleWithdrawConsent}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Withdraw Consent'}
                </button>
              </div>
            ) : (
              <div className="consent-pending">
                <p>
                  You have not given explicit consent for persistent data storage. Your data will
                  be subject to our retention policy.
                </p>
                <button
                  className="btn-primary"
                  onClick={handleConsent}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Give Explicit Consent'}
                </button>
              </div>
            )}
          </div>

          <div className="settings-info">
            <h4>About Your Data</h4>
            <ul>
              <li>
                <strong>Chat History:</strong> Stored until deleted or retention policy expires.
              </li>
              <li>
                <strong>Semantic Indexing:</strong> Creates vector embeddings of your messages for
                intelligent matching.
              </li>
              <li>
                <strong>PII:</strong> Personal information like names and emails requires explicit
                opt-in.
              </li>
              <li>
                <strong>Retention:</strong> Default retention is 90 days after last update.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettingsPanel;
