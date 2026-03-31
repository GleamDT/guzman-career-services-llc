import React, { useState } from 'react';
import './GetStartedModal.css';
import IntakeForm from './IntakeForm';
import Tech2mateIntakeForm from './Tech2mateIntakeForm';

function GetStartedModal({ isOpen, onClose }) {
    const [showIntakeForm, setShowIntakeForm] = useState(false);
    const [showTech2mateForm, setShowTech2mateForm] = useState(false);

    if (!isOpen) return null;

    if (showIntakeForm) {
        return <IntakeForm onClose={onClose} />;
    }

    if (showTech2mateForm) {
        return <Tech2mateIntakeForm onClose={onClose} />;
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
                    <button
                        className="modal-option"
                        onClick={() => setShowTech2mateForm(true)}
                    >
                        <span className="modal-option-icon">🤝</span>
                        <h3>Tech2Mate Student</h3>
                        <p>Tech2Mate students applying for exclusive career support and opportunities</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GetStartedModal;
