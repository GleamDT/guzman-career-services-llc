import React, { useState } from 'react';
import { authFetch, getAuthToken } from '../lib/authFetch';
import './IntakeForm.css';
import { TECH2MATES_TERMS_OF_SERVICE, PRIVACY_POLICY } from '../lib/legalContent';
import { COUNTRIES } from '../lib/countries';

const STEPS = [
    { label: 'Personal Info' },
    { label: 'Background' },
    { label: 'Professional' },
    { label: 'Resume' },
    { label: 'Agreement' },
];

const initialData = {
    fullName: '',
    phone: '',
    fullAddress: '',
    country: '',
    sex: '',
    veteranStatus: '',
    disabilityStatus: '',
    raceIdentity: '',
    workAuthorization: '',
    jobTitles: '',
    linkedinProfile: '',
    sharedEmail: '',
    sharedPassword: '',
    legalName: '',
    signatureDate: new Date().toISOString().split('T')[0],
    tcAgreed: false,
    finalConfirm: false,
    additionalNotes: '',
};

function dataFromClient(client) {
    if (!client) return initialData;
    return {
        fullName: client.full_name || '',
        phone: client.phone || '',
        fullAddress: client.full_address || '',
        country: client.country || '',
        sex: client.sex || '',
        veteranStatus: client.veteran_status || '',
        disabilityStatus: client.disability_status || '',
        raceIdentity: client.race_identity || '',
        workAuthorization: client.work_authorization || '',
        jobTitles: client.job_titles || '',
        linkedinProfile: client.linkedin_profile || '',
        sharedEmail: client.shared_email || '',
        sharedPassword: client.shared_password || '',
        legalName: client.legal_name || '',
        signatureDate: (client.signature_date || '').slice(0, 10) || new Date().toISOString().split('T')[0],
        tcAgreed: Boolean(client.tc_agreed),
        finalConfirm: false,
        additionalNotes: client.additional_notes || '',
    };
}

function Tech2mateOnboardingForm({ client, onClose, onComplete }) {
    const [step, setStep] = useState(client?.onboarding_step || 1);
    const [formData, setFormData] = useState(() => dataFromClient(client));
    const [resumeFile, setResumeFile] = useState(null);
    const [existingResumeFilename, setExistingResumeFilename] = useState(client?.intake_resume_filename || '');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState('terms');

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    function acceptResumeFile(file) {
        if (!file) return;
        if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
            setError('Only PDF or Word documents are accepted.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File is too large — 10 MB maximum.');
            return;
        }
        setError('');
        setResumeFile(file);
    }

    function validateStep() {
        setError('');
        if (step === 1) {
            if (!formData.fullName.trim()) return 'Full name is required.';
            if (!formData.phone.trim()) return 'Phone number is required.';
            if (!formData.fullAddress.trim()) return 'Full address is required.';
            if (!formData.country) return 'Please select your country.';
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
            if (!resumeFile && !existingResumeFilename) return 'Please upload your resume (PDF).';
        }
        if (step === 5) {
            if (!formData.legalName.trim()) return 'Please enter your full legal name as your electronic signature.';
            if (!formData.tcAgreed) return 'Please agree to the Terms & Conditions.';
            if (!formData.finalConfirm) return 'Please check the final confirmation box.';
        }
        return null;
    }

    async function handleNext() {
        const err = validateStep();
        if (err) { setError(err); return; }

        setSaving(true);
        setError('');

        try {
            if (step === 4 && resumeFile) {
                const fd = new FormData();
                fd.append('resume', resumeFile);
                const resumeRes = await fetch('/api/clients/me/intake-resume', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                    body: fd,
                });
                const rData = await resumeRes.json();
                if (!resumeRes.ok) throw new Error(rData.error || 'Resume upload failed.');
                setExistingResumeFilename(rData.client?.intake_resume_filename || resumeFile.name);
            }

            const res = await authFetch('/api/clients/me/onboarding-draft', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, step: step + 1 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not save your progress.');

            setStep(s => s + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
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
            const res = await authFetch('/api/clients/me/onboarding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed.');

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
                    <h2>Onboarding Complete!</h2>
                    <p>
                        Thanks for completing your onboarding with Guzman Career Services LLC.
                        Your information has been saved to your account.
                    </p>
                    <p className="intake-success-note">
                        Our dedicated team will review your submission and reach out within
                        <strong> 1–2 business days</strong> to discuss your next steps.
                    </p>
                    <button className="intake-btn-primary" onClick={onComplete}>
                        Continue to Payment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="intake-overlay">
            <div className="intake-container">
                {onClose && (
                    <button className="intake-close" onClick={onClose} aria-label="Close and finish later">✕</button>
                )}
                {/* Header */}
                <div className="intake-header">
                    <h2 className="intake-title">Job Application Services — Tech2Mate Onboarding</h2>
                    <p className="intake-subtitle">
                        Please complete this form accurately. The information provided will be used to submit
                        job applications on your behalf.
                    </p>
                    <p className="intake-subtitle" style={{ marginTop: '0.25rem', opacity: 0.75 }}>
                        Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                    </p>
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

                    {step === 1 && (
                        <div className="intake-fields">
                            <div className="intake-field">
                                <label>Full Name <span className="req">*</span></label>
                                <input type="text" value={formData.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Jane Doe" />
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
                                <label>Country <span className="req">*</span></label>
                                <select value={formData.country} onChange={e => set('country', e.target.value)}>
                                    <option value="">Select…</option>
                                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                </select>
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

                    {step === 3 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Job Title(s) <span className="req">*</span></label>
                                <input type="text" value={formData.jobTitles} onChange={e => set('jobTitles', e.target.value)} placeholder="e.g. Software Engineer, Project Manager" />
                                <span className="intake-hint">Separate multiple titles with commas.</span>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>LinkedIn Profile / Link</label>
                                <input type="url" value={formData.linkedinProfile} onChange={e => set('linkedinProfile', e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
                                <span className="intake-hint">
                                    We recommend disabling your LinkedIn if it is not updated or if you are applying to multiple roles.
                                </span>
                            </div>

                            <div className="intake-callout">
                                <strong>Shared Job-Search Credentials (Gmail Preferred)</strong>
                                <p>
                                    Please provide the email address and password you'd like our team
                                    to use when applying to jobs on your behalf. Please ensure this email
                                    account is accessible and remains active throughout the service period.
                                </p>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Shared Email Address <span className="req">*</span></label>
                                <input type="email" value={formData.sharedEmail} onChange={e => set('sharedEmail', e.target.value)} placeholder="jobsearch@gmail.com" />
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
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Upload Resume <span className="req">*</span></label>
                                <div
                                    className={`intake-dropzone ${resumeFile || existingResumeFilename ? 'intake-dropzone-filled' : ''}`}
                                    onClick={() => document.getElementById('t2m-onboard-resume-input').click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                        e.preventDefault();
                                        acceptResumeFile(e.dataTransfer.files[0]);
                                    }}
                                >
                                    <input
                                        id="t2m-onboard-resume-input"
                                        type="file"
                                        accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                                        style={{ display: 'none' }}
                                        onChange={e => acceptResumeFile(e.target.files[0])}
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
                                    ) : existingResumeFilename ? (
                                        <>
                                            <div className="intake-dz-icon">📄</div>
                                            <p className="intake-dz-name">{existingResumeFilename}</p>
                                            <p className="intake-dz-size">Already uploaded</p>
                                            <button
                                                type="button"
                                                className="intake-dz-remove"
                                                onClick={e => { e.stopPropagation(); document.getElementById('t2m-onboard-resume-input').click(); }}
                                            >
                                                Replace
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
                                <label>Terms &amp; Conditions</label>
                                <button
                                    type="button"
                                    className="intake-tc-link-btn"
                                    onClick={() => { setTermsModalTab('terms'); setShowTermsModal(true); }}
                                >
                                    Read Full Terms &amp; Conditions ↗
                                </button>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label className="intake-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.tcAgreed}
                                        onChange={e => set('tcAgreed', e.target.checked)}
                                    />
                                    <span>I have read and agree to the Terms &amp; Conditions. <span className="req">*</span></span>
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
                                        I confirm that the information provided is accurate and that I am
                                        electronically signing this form. <span className="req">*</span>
                                    </span>
                                </label>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Is there anything else we should know about your job search?</label>
                                <textarea
                                    rows={4}
                                    value={formData.additionalNotes}
                                    onChange={e => set('additionalNotes', e.target.value)}
                                    placeholder="Share any additional context, preferences, or concerns…"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="intake-nav">
                    {step > 1 && (
                        <button className="intake-btn-secondary" onClick={handleBack} disabled={loading || saving}>
                            ← Back
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < STEPS.length ? (
                        <button className="intake-btn-primary" onClick={handleNext} disabled={saving}>
                            {saving ? 'Saving…' : 'Next →'}
                        </button>
                    ) : (
                        <button className="intake-btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting…' : 'Complete Onboarding'}
                        </button>
                    )}
                </div>
            </div>

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
                                    Terms &amp; Conditions
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
                                    <h3>{TECH2MATES_TERMS_OF_SERVICE.title}</h3>
                                    <h4>{TECH2MATES_TERMS_OF_SERVICE.subtitle}</h4>
                                    <p className="intake-tc-effective">Effective Date: {TECH2MATES_TERMS_OF_SERVICE.effectiveDate}</p>

                                    {TECH2MATES_TERMS_OF_SERVICE.sections.map((section) => (
                                        <div key={section.number} className="intake-tc-section">
                                            <h5>{section.number}. {section.title}</h5>
                                            {section.content && <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>}
                                            {section.subsections && section.subsections.map((sub, subIdx) => (
                                                <div key={subIdx} className="intake-tc-subsection">
                                                    <h6>{sub.subtitle}</h6>
                                                    {sub.content && <p>{sub.content}</p>}
                                                    {sub.items && (
                                                        <ul>
                                                            {sub.items.map((item, idx) => (
                                                                <li key={idx}>{item}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                            {section.items && (
                                                <ul>
                                                    {section.items.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {section.footer && <p className="intake-tc-footer" style={{ whiteSpace: 'pre-line' }}>{section.footer}</p>}
                                        </div>
                                    ))}

                                    <div className="intake-tc-section intake-tc-final">
                                        <h5>{TECH2MATES_TERMS_OF_SERVICE.finalAcknowledgment.title}</h5>
                                        <p>{TECH2MATES_TERMS_OF_SERVICE.finalAcknowledgment.content}</p>
                                        <ul>
                                            {TECH2MATES_TERMS_OF_SERVICE.finalAcknowledgment.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                        <p className="intake-tc-final-footer">{TECH2MATES_TERMS_OF_SERVICE.finalAcknowledgment.footer}</p>
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
                                            {section.content && <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>}
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
                            <button className="intake-btn-primary" onClick={() => setShowTermsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tech2mateOnboardingForm;
