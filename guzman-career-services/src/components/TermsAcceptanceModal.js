import React, { useState, useRef } from 'react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, TERMS_VERSION } from '../lib/legalContent';
import './TermsAcceptanceModal.css';

function TermsAcceptanceModal({ onAccept, onDecline }) {
    const [activeTab, setActiveTab] = useState('terms');
    const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
    const [hasScrolledPrivacy, setHasScrolledPrivacy] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const contentRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
        
        if (isNearBottom) {
            if (activeTab === 'terms') setHasScrolledTerms(true);
            if (activeTab === 'privacy') setHasScrolledPrivacy(true);
        }
    };

    const handleAccept = async () => {
        if (!termsChecked || !privacyChecked) return;
        
        setLoading(true);
        try {
            await onAccept(TERMS_VERSION);
        } catch (err) {
            console.error('Failed to accept terms:', err);
        } finally {
            setLoading(false);
        }
    };

    const canCheckTerms = hasScrolledTerms || termsChecked;
    const canCheckPrivacy = hasScrolledPrivacy || privacyChecked;
    const canAccept = termsChecked && privacyChecked;

    return (
        <div className="tam-overlay">
            <div className="tam-modal">
                <div className="tam-header">
                    <div className="tam-logo">
                        <img src="/logo.png" alt="Guzman Career Services" />
                    </div>
                    <h2>Updated Terms & Conditions</h2>
                    <p>Please review and accept our updated Terms and Conditions and Privacy Policy to continue using your account.</p>
                </div>

                <div className="tam-tabs">
                    <button 
                        className={`tam-tab ${activeTab === 'terms' ? 'tam-tab--active' : ''}`}
                        onClick={() => setActiveTab('terms')}
                    >
                        Terms & Conditions
                        {termsChecked && <span className="tam-tab-check">✓</span>}
                    </button>
                    <button 
                        className={`tam-tab ${activeTab === 'privacy' ? 'tam-tab--active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        Privacy Policy
                        {privacyChecked && <span className="tam-tab-check">✓</span>}
                    </button>
                </div>

                <div 
                    className="tam-content" 
                    ref={contentRef}
                    onScroll={handleScroll}
                >
                    {activeTab === 'terms' && (
                        <div className="tam-document">
                            <div className="tam-doc-header">
                                <h3>{TERMS_OF_SERVICE.title}</h3>
                                <h4>{TERMS_OF_SERVICE.subtitle}</h4>
                                <p className="tam-effective">Effective Date: {TERMS_OF_SERVICE.effectiveDate}</p>
                            </div>

                            {TERMS_OF_SERVICE.sections.map((section) => (
                                <div key={section.number} className="tam-section">
                                    <h5>{section.number}. {section.title}</h5>
                                    {section.content && <p>{section.content}</p>}
                                    {section.items && (
                                        <ul>
                                            {section.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.footer && <p className="tam-section-footer">{section.footer}</p>}
                                </div>
                            ))}

                            <div className="tam-section tam-final">
                                <h5>{TERMS_OF_SERVICE.finalAcknowledgment.title}</h5>
                                <p>{TERMS_OF_SERVICE.finalAcknowledgment.content}</p>
                                <ul>
                                    {TERMS_OF_SERVICE.finalAcknowledgment.items.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                                <p className="tam-final-footer">{TERMS_OF_SERVICE.finalAcknowledgment.footer}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="tam-document">
                            <div className="tam-doc-header">
                                <h3>{PRIVACY_POLICY.title}</h3>
                                <h4>{PRIVACY_POLICY.subtitle}</h4>
                                <p className="tam-effective">Effective Date: {PRIVACY_POLICY.effectiveDate}</p>
                            </div>

                            {PRIVACY_POLICY.sections.map((section) => (
                                <div key={section.number} className="tam-section">
                                    <h5>{section.number}. {section.title}</h5>
                                    {section.content && <p>{section.content}</p>}
                                    {section.subsections && section.subsections.map((sub, subIdx) => (
                                        <div key={subIdx} className="tam-subsection">
                                            <h6>{sub.subtitle}</h6>
                                            <ul>
                                                {sub.items.map((item, idx) => (
                                                    <li key={idx}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                    {section.items && (
                                        <ul>
                                            {section.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.footer && <p className="tam-section-footer">{section.footer}</p>}
                                </div>
                            ))}

                            <div className="tam-section tam-final">
                                <h5>{PRIVACY_POLICY.acknowledgment.title}</h5>
                                <p>{PRIVACY_POLICY.acknowledgment.content}</p>
                            </div>
                        </div>
                    )}
                </div>

                {!hasScrolledTerms && activeTab === 'terms' && (
                    <div className="tam-scroll-hint">
                        <span>↓ Scroll to read the full document</span>
                    </div>
                )}
                {!hasScrolledPrivacy && activeTab === 'privacy' && (
                    <div className="tam-scroll-hint">
                        <span>↓ Scroll to read the full document</span>
                    </div>
                )}

                <div className="tam-checkboxes">
                    <label className={`tam-checkbox ${!canCheckTerms ? 'tam-checkbox--disabled' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={termsChecked}
                            onChange={(e) => canCheckTerms && setTermsChecked(e.target.checked)}
                            disabled={!canCheckTerms}
                        />
                        <span className="tam-checkbox-mark"></span>
                        <span>I have read and agree to the <strong>Terms & Conditions</strong></span>
                    </label>
                    <label className={`tam-checkbox ${!canCheckPrivacy ? 'tam-checkbox--disabled' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={privacyChecked}
                            onChange={(e) => canCheckPrivacy && setPrivacyChecked(e.target.checked)}
                            disabled={!canCheckPrivacy}
                        />
                        <span className="tam-checkbox-mark"></span>
                        <span>I have read and agree to the <strong>Privacy Policy</strong></span>
                    </label>
                </div>

                <div className="tam-actions">
                    <button 
                        className="tam-btn tam-btn--decline"
                        onClick={onDecline}
                        disabled={loading}
                    >
                        Decline & Logout
                    </button>
                    <button 
                        className="tam-btn tam-btn--accept"
                        onClick={handleAccept}
                        disabled={!canAccept || loading}
                    >
                        {loading ? 'Processing...' : 'Accept & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TermsAcceptanceModal;
