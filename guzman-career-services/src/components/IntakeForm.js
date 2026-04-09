import React, { useState } from 'react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../lib/legalContent';
import './IntakeForm.css';

const STEPS = [
    { label: 'Personal Info' },
    { label: 'Background' },
    { label: 'Professional' },
    { label: 'Resume' },
    { label: 'Agreement' },
];

const initialData = {
    fullName: '',
    email: '',
    referredBy: '',
    phone: '',
    fullAddress: '',
    sex: '',
    veteranStatus: '',
    disabilityStatus: '',
    raceIdentity: '',
    workAuthorization: '',
    jobTitles: '',
    sharedEmail: '',
    sharedPassword: '',
    legalName: '',
    signatureDate: new Date().toISOString().split('T')[0],
    tcAgreed: false,
    finalConfirm: false,
};

function IntakeForm({ onClose }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialData);
    const [resumeFile, setResumeFile] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState('terms');

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    function validateStep() {
        setError('');
        if (step === 1) {
            if (!formData.fullName.trim()) return 'Full name is required.';
            if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'A valid email address is required.';
            if (!formData.phone.trim()) return 'Phone number is required.';
            if (!formData.fullAddress.trim()) return 'Full address is required.';
            if (!formData.sex) return 'Please select your sex.';
        }
        if (step === 2) {
            if (!formData.veteranStatus) return 'Please indicate your veteran status.';
            if (!formData.disabilityStatus) return 'Please indicate your disability status.';
            if (!formData.raceIdentity) return 'Please select your race/ethnicity identity.';
            if (!formData.workAuthorization) return 'Please select your work authorization status.';
        }
        if (step === 3) {
            if (!formData.jobTitles.trim()) return 'Please enter your job title(s).';
            if (!formData.sharedEmail.trim() || !/\S+@\S+\.\S+/.test(formData.sharedEmail)) return 'A valid shared email address is required.';
            if (!formData.sharedPassword || formData.sharedPassword.length < 6) return 'Password must be at least 6 characters.';
        }
        if (step === 4) {
            if (!resumeFile) return 'Please upload your resume (PDF).';
        }
        if (step === 5) {
            if (!formData.legalName.trim()) return 'Please enter your full legal name as your electronic signature.';
            if (!formData.tcAgreed) return 'Please agree to the Terms & Conditions.';
            if (!formData.finalConfirm) return 'Please check the final confirmation box.';
        }
        return null;
    }

    function handleNext() {
        const err = validateStep();
        if (err) { setError(err); return; }
        setStep(s => s + 1);
    }

    function handleBack() {
        setError('');
        setStep(s => s - 1);
    }

    async function handleSubmit() {
        const err = validateStep();
        if (err) { setError(err); return; }

        setLoading(true);
        setError('');

        try {
            // Step 1: Create account + store intake data
            const res = await fetch('/api/intake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    referredBy: formData.referredBy,
                    phone: formData.phone,
                    fullAddress: formData.fullAddress,
                    sex: formData.sex,
                    veteranStatus: formData.veteranStatus,
                    disabilityStatus: formData.disabilityStatus,
                    raceIdentity: formData.raceIdentity,
                    workAuthorization: formData.workAuthorization,
                    jobTitles: formData.jobTitles,
                    sharedEmail: formData.sharedEmail,
                    sharedPassword: formData.sharedPassword,
                    legalName: formData.legalName,
                    signatureDate: formData.signatureDate,
                    tcAgreed: formData.tcAgreed,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed.');

            const submissionId = data.submissionId;

            // Step 2: Upload resume
            if (resumeFile && submissionId) {
                const fd = new FormData();
                fd.append('resume', resumeFile);
                const resumeRes = await fetch(`/api/intake/${submissionId}/resume`, {
                    method: 'POST',
                    body: fd,
                });
                if (!resumeRes.ok) {
                    const rData = await resumeRes.json();
                    throw new Error(rData.error || 'Resume upload failed.');
                }
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="intake-overlay">
                <div className="intake-container intake-success-card">
                    <div className="intake-success-icon">✓</div>
                    <h2>Thank You for Registering!</h2>
                    <p>
                        Your intake form has been successfully received by
                        Guzman Career Services LLC. We appreciate you taking
                        the time to complete your application.
                    </p>
                    <p className="intake-success-note">
                        Our dedicated team will carefully review your submission
                        and reach out to you via the email address provided
                        within <strong>1–2 business days</strong> to discuss
                        your next steps. We look forward to supporting your
                        career journey!
                    </p>
                    <button className="intake-btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="intake-overlay" onClick={onClose}>
            <div className="intake-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="intake-header">
                    <button className="intake-close" onClick={onClose} aria-label="Close">✕</button>
                    <h2 className="intake-title">General Client Intake Form</h2>
                    <p className="intake-subtitle">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
                </div>

                {/* Progress bar */}
                <div className="intake-progress-track">
                    {STEPS.map((_s, i) => (
                        <div
                            key={i}
                            className={`intake-progress-seg ${i + 1 < step ? 'done' : ''} ${i + 1 === step ? 'active' : ''}`}
                        />
                    ))}
                </div>

                {/* Form body */}
                <div className="intake-body">
                    {error && <div className="intake-error">{error}</div>}

                    {/* ── STEP 1: Personal Info ── */}
                    {step === 1 && (
                        <div className="intake-fields">
                            <div className="intake-field">
                                <label>Full Name <span className="req">*</span></label>
                                <input type="text" value={formData.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Jane Doe" />
                            </div>
                            <div className="intake-field">
                                <label>Email Address <span className="req">*</span></label>
                                <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
                            </div>
                            <div className="intake-field">
                                <label>Who Referred You?</label>
                                <input type="text" value={formData.referredBy} onChange={e => set('referredBy', e.target.value)} placeholder="Name or organization" />
                            </div>
                            <div className="intake-field">
                                <label>Phone Number <span className="req">*</span></label>
                                <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
                            </div>
                            <div className="intake-field intake-field-full">
                                <label>Full Address <span className="req">*</span></label>
                                <textarea rows={3} value={formData.fullAddress} onChange={e => set('fullAddress', e.target.value)} placeholder="Street, City, State, ZIP" />
                            </div>
                            <div className="intake-field">
                                <label>Sex <span className="req">*</span></label>
                                <select value={formData.sex} onChange={e => set('sex', e.target.value)}>
                                    <option value="">Select…</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Non-binary</option>
                                    <option>Prefer not to say</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Background / Identity ── */}
                    {step === 2 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Veteran Status <span className="req">*</span></label>
                                <div className="intake-radios">
                                    {['Yes', 'No'].map(v => (
                                        <label key={v} className="intake-radio">
                                            <input type="radio" name="veteran" value={v} checked={formData.veteranStatus === v} onChange={() => set('veteranStatus', v)} />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Disability Status <span className="req">*</span></label>
                                <div className="intake-radios">
                                    {['Yes', 'No'].map(v => (
                                        <label key={v} className="intake-radio">
                                            <input type="radio" name="disability" value={v} checked={formData.disabilityStatus === v} onChange={() => set('disabilityStatus', v)} />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Race / Ethnicity Identity <span className="req">*</span></label>
                                <div className="intake-radios intake-radios-col">
                                    {[
                                        'White',
                                        'Black or African American',
                                        'Asian',
                                        'Hispanic or Latino',
                                        'Native American or Alaska Native',
                                        'Two or More Races',
                                        'Prefer not to say',
                                    ].map(v => (
                                        <label key={v} className="intake-radio">
                                            <input type="radio" name="race" value={v} checked={formData.raceIdentity === v} onChange={() => set('raceIdentity', v)} />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Work Authorization Status <span className="req">*</span></label>
                                <div className="intake-radios intake-radios-col">
                                    {[
                                        'U.S. Citizen',
                                        'Green Card Holder',
                                        'EAD (Employment Authorization Document)',
                                    ].map(v => (
                                        <label key={v} className="intake-radio">
                                            <input type="radio" name="workAuth" value={v} checked={formData.workAuthorization === v} onChange={() => set('workAuthorization', v)} />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Professional + Shared Credentials ── */}
                    {step === 3 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Job Title(s) <span className="req">*</span></label>
                                <input type="text" value={formData.jobTitles} onChange={e => set('jobTitles', e.target.value)} placeholder="e.g. Software Engineer, Project Manager" />
                                <span className="intake-hint">Separate multiple titles with commas.</span>
                            </div>

                            <div className="intake-callout">
                                <strong>Shared Job-Search Credentials</strong>
                                <p>
                                    Please provide the email address and password you'd like our team
                                    to use when applying to jobs on your behalf. Ensure this account
                                    remains accessible throughout the service period.
                                </p>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Shared Email Address <span className="req">*</span></label>
                                <input type="email" value={formData.sharedEmail} onChange={e => set('sharedEmail', e.target.value)} placeholder="jobsearch@example.com" />
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Shared Password <span className="req">*</span></label>
                                <div className="intake-password-wrap">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.sharedPassword}
                                        onChange={e => set('sharedPassword', e.target.value)}
                                        placeholder="Password (min. 6 characters)"
                                    />
                                    <button type="button" className="intake-eye" onClick={() => setShowPassword(p => !p)}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <span className="intake-hint">
                                    This password will also be used to log into your client portal.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Resume Upload ── */}
                    {step === 4 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Upload Resume <span className="req">*</span></label>
                                <div
                                    className={`intake-dropzone ${resumeFile ? 'intake-dropzone-filled' : ''}`}
                                    onClick={() => document.getElementById('resume-input').click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                        e.preventDefault();
                                        const f = e.dataTransfer.files[0];
                                        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                        if (f && allowed.includes(f.type)) setResumeFile(f);
                                        else setError('Only PDF or Word documents are accepted.');
                                    }}
                                >
                                    <input
                                        id="resume-input"
                                        type="file"
                                        accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            const f = e.target.files[0];
                                            if (f) setResumeFile(f);
                                        }}
                                    />
                                    {resumeFile ? (
                                        <>
                                            <div className="intake-dz-icon">📄</div>
                                            <p className="intake-dz-name">{resumeFile.name}</p>
                                            <p className="intake-dz-size">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <button
                                                type="button"
                                                className="intake-dz-remove"
                                                onClick={e => { e.stopPropagation(); setResumeFile(null); }}
                                            >
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="intake-dz-icon">📎</div>
                                            <p className="intake-dz-prompt">Click or drag &amp; drop your resume here</p>
                                            <p className="intake-dz-sub">PDF or Word · Max 10 MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 5: Legal Agreement ── */}
                    {step === 5 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Full Legal Name (Electronic Signature) <span className="req">*</span></label>
                                <input
                                    type="text"
                                    className="intake-signature-input"
                                    value={formData.legalName}
                                    onChange={e => set('legalName', e.target.value)}
                                    placeholder="Type your full legal name"
                                />
                                <span className="intake-hint">By typing your name you are signing this form electronically.</span>
                            </div>

                            <div className="intake-field">
                                <label>Date of Signature <span className="req">*</span></label>
                                <input type="date" value={formData.signatureDate} onChange={e => set('signatureDate', e.target.value)} />
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Terms &amp; Conditions and Privacy Policy</label>
                                <div className="intake-tc-buttons">
                                    <button 
                                        type="button" 
                                        className="intake-tc-link-btn"
                                        onClick={() => { setTermsModalTab('terms'); setShowTermsModal(true); }}
                                    >
                                        📄 Read Terms &amp; Conditions
                                    </button>
                                    <button 
                                        type="button" 
                                        className="intake-tc-link-btn"
                                        onClick={() => { setTermsModalTab('privacy'); setShowTermsModal(true); }}
                                    >
                                        🔒 Read Privacy Policy
                                    </button>
                                </div>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label className="intake-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.tcAgreed}
                                        onChange={e => set('tcAgreed', e.target.checked)}
                                    />
                                    <span>I have read and agree to the Terms &amp; Conditions and Privacy Policy. <span className="req">*</span></span>
                                </label>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label className="intake-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.finalConfirm}
                                        onChange={e => set('finalConfirm', e.target.checked)}
                                    />
                                    <span>
                                        I confirm that all information provided is accurate and complete,
                                        and I understand that Guzman Career Services LLC will use this
                                        information to provide career support on my behalf. <span className="req">*</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* T&C Modal */}
                    {showTermsModal && (
                        <div className="intake-tc-modal-overlay" onClick={() => setShowTermsModal(false)}>
                            <div className="intake-tc-modal" onClick={e => e.stopPropagation()}>
                                <div className="intake-tc-modal-header">
                                    <div className="intake-tc-modal-tabs">
                                        <button 
                                            className={`intake-tc-tab ${termsModalTab === 'terms' ? 'active' : ''}`}
                                            onClick={() => setTermsModalTab('terms')}
                                        >
                                            Terms & Conditions
                                        </button>
                                        <button 
                                            className={`intake-tc-tab ${termsModalTab === 'privacy' ? 'active' : ''}`}
                                            onClick={() => setTermsModalTab('privacy')}
                                        >
                                            Privacy Policy
                                        </button>
                                    </div>
                                    <button className="intake-tc-modal-close" onClick={() => setShowTermsModal(false)}>✕</button>
                                </div>
                                <div className="intake-tc-modal-content">
                                    {termsModalTab === 'terms' && (
                                        <div className="intake-tc-document">
                                            <h3>{TERMS_OF_SERVICE.title}</h3>
                                            <h4>{TERMS_OF_SERVICE.subtitle}</h4>
                                            <p className="intake-tc-effective">Effective Date: {TERMS_OF_SERVICE.effectiveDate}</p>
                                            
                                            {TERMS_OF_SERVICE.sections.map((section) => (
                                                <div key={section.number} className="intake-tc-section">
                                                    <h5>{section.number}. {section.title}</h5>
                                                    {section.content && <p>{section.content}</p>}
                                                    {section.items && (
                                                        <ul>
                                                            {section.items.map((item, idx) => (
                                                                <li key={idx}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    {section.footer && <p className="intake-tc-footer">{section.footer}</p>}
                                                </div>
                                            ))}

                                            <div className="intake-tc-section intake-tc-final">
                                                <h5>{TERMS_OF_SERVICE.finalAcknowledgment.title}</h5>
                                                <p>{TERMS_OF_SERVICE.finalAcknowledgment.content}</p>
                                                <ul>
                                                    {TERMS_OF_SERVICE.finalAcknowledgment.items.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                                <p className="intake-tc-final-footer">{TERMS_OF_SERVICE.finalAcknowledgment.footer}</p>
                                            </div>
                                        </div>
                                    )}

                                    {termsModalTab === 'privacy' && (
                                        <div className="intake-tc-document">
                                            <h3>{PRIVACY_POLICY.title}</h3>
                                            <h4>{PRIVACY_POLICY.subtitle}</h4>
                                            <p className="intake-tc-effective">Effective Date: {PRIVACY_POLICY.effectiveDate}</p>
                                            
                                            {PRIVACY_POLICY.sections.map((section) => (
                                                <div key={section.number} className="intake-tc-section">
                                                    <h5>{section.number}. {section.title}</h5>
                                                    {section.content && <p>{section.content}</p>}
                                                    {section.subsections && section.subsections.map((sub, subIdx) => (
                                                        <div key={subIdx} className="intake-tc-subsection">
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
                                                    {section.footer && <p className="intake-tc-footer">{section.footer}</p>}
                                                </div>
                                            ))}

                                            <div className="intake-tc-section intake-tc-final">
                                                <h5>{PRIVACY_POLICY.acknowledgment.title}</h5>
                                                <p>{PRIVACY_POLICY.acknowledgment.content}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="intake-tc-modal-footer">
                                    <label className="intake-tc-modal-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.tcAgreed}
                                            onChange={e => set('tcAgreed', e.target.checked)}
                                        />
                                        <span>I have read and agree to the Terms &amp; Conditions and Privacy Policy</span>
                                    </label>
                                    <button 
                                        className="intake-btn-primary" 
                                        onClick={() => setShowTermsModal(false)}
                                    >
                                        {formData.tcAgreed ? 'Continue' : 'Close'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="intake-nav">
                    {step > 1 && (
                        <button className="intake-btn-secondary" onClick={handleBack} disabled={loading}>
                            ← Back
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < STEPS.length ? (
                        <button className="intake-btn-primary" onClick={handleNext}>
                            Next →
                        </button>
                    ) : (
                        <button className="intake-btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting…' : 'Submit Application'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IntakeForm;
