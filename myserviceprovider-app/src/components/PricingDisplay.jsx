/**
 * ServiceFlow AI Pricing Display Component
 * Example React component showing how to integrate with the pricing API
 */

import React, { useState, useEffect } from 'react';
import { usePricing } from '../utils/pricing-client';

export function PricingDisplay({ service = 'image', network = 'testnet' }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState('wS');
  
  const { getPaymentOptions, getNetworkDisplay } = usePricing(network);

  useEffect(() => {
    async function fetchPricing() {
      setLoading(true);
      setError(null);
      
      try {
        const options = await getPaymentOptions(service);
        setPricing(options);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [service, network]);

  if (loading) {
    return (
      <div className="pricing-display loading">
        <div className="spinner"></div>
        <p>Loading current prices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-display error">
        <div className="error-icon">⚠️</div>
        <h3>Pricing Unavailable</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!pricing || pricing.length === 0) {
    return (
      <div className="pricing-display empty">
        <p>No pricing options available</p>
      </div>
    );
  }

  const selectedOption = pricing.find(opt => opt.token === selectedToken) || pricing[0];

  return (
    <div className="pricing-display">
      <div className="pricing-header">
        <h3>{service === 'image' ? '🎨 Image Generation' : '🎬 Video Generation'}</h3>
        <div className="network-badge">
          <span className="network-dot"></span>
          {getNetworkDisplay()}
        </div>
      </div>

      <div className="pricing-content">
        <div className="price-summary">
          <div className="usd-price">
            {selectedOption.usdValue}
          </div>
          <div className="token-price">
            {selectedOption.amountFormatted}
          </div>
          <div className="conversion-rate">
            1 {selectedOption.token} ≈ ${selectedOption.pricePerToken.toFixed(6)}
          </div>
        </div>

        <div className="token-selector">
          <h4>Payment Options</h4>
          <div className="token-options">
            {pricing.map((option) => (
              <button
                key={option.id}
                className={`token-option ${selectedToken === option.token ? 'selected' : ''} ${option.recommended ? 'recommended' : ''}`}
                onClick={() => setSelectedToken(option.token)}
              >
                <div className="token-info">
                  <span className="token-symbol">{option.token}</span>
                  <span className="token-name">{option.tokenName}</span>
                  {option.recommended && <span className="recommended-badge">Recommended</span>}
                </div>
                <div className="token-amount">
                  {option.amountFormatted}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pricing-footer">
          <p className="disclaimer">
            Prices update every 30 seconds based on current market rates
          </p>
          <div className="powered-by">
            <span>Powered by</span>
            <img src="/openocean-logo.png" alt="OpenOcean" className="partner-logo" />
            <img src="/sonic-logo.png" alt="Sonic" className="partner-logo" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickPriceDisplay({ token = 'wS', amount = 1, network = 'testnet' }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getTokenPrice } = usePricing(network);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const priceData = await getTokenPrice(token, amount);
        setPrice(priceData);
      } catch (err) {
        console.error('Price fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [token, amount, network]);

  if (loading || !price) {
    return <span className="price-loading">Loading...</span>;
  }

  return (
    <span className="quick-price" title={`${price.display.amountFormatted} = ${price.display.totalFormatted}`}>
      {price.display.priceFormatted}
    </span>
  );
}

// CSS styles (add to your CSS file)
const styles = `
.pricing-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.pricing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.network-badge {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.network-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  margin-right: 6px;
}

.price-summary {
  text-align: center;
  margin-bottom: 24px;
}

.usd-price {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}

.token-price {
  font-size: 1.5rem;
  opacity: 0.9;
  margin-bottom: 4px;
}

.conversion-rate {
  font-size: 0.9rem;
  opacity: 0.7;
}

.token-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.token-option:hover {
  background: rgba(255, 255, 255, 0.2);
}

.token-option.selected {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.token-option.recommended {
  border-color: #fbbf24;
}

.recommended-badge {
  background: #fbbf24;
  color: #1f2937;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
}

.pricing-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.disclaimer {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 8px;
}

.powered-by {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  opacity: 0.7;
}

.partner-logo {
  height: 16px;
  filter: brightness(0) invert(1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.error {
  text-align: center;
  padding: 40px;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}
`;