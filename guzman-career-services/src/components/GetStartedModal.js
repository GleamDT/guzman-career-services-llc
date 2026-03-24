import React, { useState } from 'react';
import './GetStartedModal.css';
import IntakeForm from './IntakeForm';

const TECH2MATE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvjvE3MfW9VrPgMeWrfTepbpbFNqZxr4NIdWBBE_JSsmmAwg/viewform';

function GetStartedModal({ isOpen, onClose }) {
    const [showIntakeForm, setShowIntakeForm] = useState(false);

    if (!isOpen) return null;

    if (showIntakeForm) {
        return <IntakeForm onClose={onClose} />;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2 className="modal-title">How would you like to get started?</h2>
                <p className="modal-subtitle">Choose the option that best describes you</p>
                <div className="modal-options">
                    <button
                        className="modal-option"
                        onClick={() => setShowIntakeForm(true)}
                    >
                        <span className="modal-option-icon">💼</span>
                        <h3>General Client</h3>
                        <p>Professionals seeking career support, resume optimization, and job placement help</p>
                    </button>
                    <a
                        href={TECH2MATE_FORM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modal-option"
                    >
                        <span className="modal-option-icon">🤝</span>
                        <h3>Tech2Mate Student</h3>
                        <p>Tech2Mate students applying for exclusive career support and opportunities</p>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default GetStartedModal;
