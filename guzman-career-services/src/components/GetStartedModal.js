import React from 'react';
import './GetStartedModal.css';

const GENERAL_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd0r-Oqtumv--5uwbrTpRnhK7eR8vhk6j0svQVyMLUxEqwdGg/viewform';
const TECH2MATE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvjvE3MfW9VrPgMeWrfTepbpbFNqZxr4NIdWBBE_JSsmmAwg/viewform';

function GetStartedModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h2 className="modal-title">How would you like to get started?</h2>
                <p className="modal-subtitle">Choose the option that best describes you</p>
                <div className="modal-options">
                    <a
                        href={GENERAL_FORM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modal-option"
                    >
                        <span className="modal-option-icon">💼</span>
                        <h3>General Client</h3>
                        <p>Professionals seeking career support, resume optimization, and job placement help</p>
                    </a>
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
