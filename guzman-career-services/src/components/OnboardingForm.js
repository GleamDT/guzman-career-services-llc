import React, { useState, useEffect } from 'react';
import { authFetch, getAuthToken } from '../lib/authFetch';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../lib/legalContent';
import {
    ONBOARDING_COUNTRIES, regionOptionsFor, regionLabelFor,
    postalLabelFor, postalPlaceholderFor, buildFullAddress,
} from '../lib/usCaRegions';
import OnboardingProgress, { stageForOnboardingStep } from './OnboardingProgress';
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
    referredBy: '',
    phone: '',
    fullAddress: '',
    addressStreet: '',
    addressCity: '',
    addressRegion: '',
    addressPostalCode: '',
    country: '',
    sex: '',
    veteranStatus: '',
    disabilityStatus: '',
    raceIdentity: '',
    workAuthorization: '',
    educationHistory: [{ institution: '', degree: '', datesAttended: '' }],
    jobTitles: '',
    minSalaryExpectation: '',
    sharedEmail: '',
    sharedPassword: '',
    commsEmail: '',
    legalName: '',
    signatureDate: new Date().toISOString().split('T')[0],
    tcAgreed: false,
    finalConfirm: false,
};

function dataFromClient(client) {
    if (!client) return initialData;
    return {
        fullName: client.full_name || '',
        referredBy: client.referred_by || '',
        phone: client.phone || '',
        fullAddress: client.full_address || '',
        addressStreet: '',
        addressCity: '',
        addressRegion: '',
        addressPostalCode: '',
        country: client.country || '',
        sex: client.sex || '',
        veteranStatus: client.veteran_status || '',
        disabilityStatus: client.disability_status || '',
        raceIdentity: client.race_identity || '',
        workAuthorization: client.work_authorization || '',
        educationHistory: (client.education_history && client.education_history.length > 0)
            ? client.education_history
            : [{ institution: '', degree: '', datesAttended: '' }],
        jobTitles: client.job_titles || '',
        minSalaryExpectation: client.min_salary_expectation || '',
        sharedEmail: client.shared_email || '',
        sharedPassword: client.shared_password || '',
        commsEmail: client.comms_email || '',
        legalName: client.legal_name || '',
        signatureDate: (client.signature_date || '').slice(0, 10) || new Date().toISOString().split('T')[0],
        tcAgreed: Boolean(client.tc_agreed),
        finalConfirm: false,
    };
}

function OnboardingForm({ client, onClose, onComplete }) {
    const [step, setStep] = useState(client?.onboarding_step || 1);
    const [formData, setFormData] = useState(() => dataFromClient(client));
    const [resumeFile, setResumeFile] = useState(null);
    const [existingResumeFilename, setExistingResumeFilename] = useState(client?.intake_resume_filename || '');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState('terms');

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    // Keep the single fullAddress string (what the backend stores) in sync with
    // the structured street/city/region/postal fields the user actually edits.
    useEffect(() => {
        setFormData(prev => ({ ...prev, fullAddress: buildFullAddress(prev) }));
    }, [formData.addressStreet, formData.addressCity, formData.addressRegion, formData.addressPostalCode]);

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
            if (!formData.country) return 'Please select your country.';
            if (!formData.addressStreet.trim()) return 'Street address is required.';
            if (!formData.addressCity.trim()) return 'City is required.';
            if (!formData.addressRegion) return `Please select your ${regionLabelFor(formData.country).toLowerCase()}.`;
            if (!formData.addressPostalCode.trim()) return `${postalLabelFor(formData.country)} is required.`;
            if (!formData.sex) return 'Please select your sex.';
        }
        if (step === 2) {
            if (!formData.veteranStatus) return 'Please indicate your veteran status.';
            if (!formData.disabilityStatus) return 'Please indicate your disability status.';
            if (!formData.raceIdentity) return 'Please select your race/ethnicity identity.';
            if (!formData.workAuthorization) return 'Please select your work authorization status.';
            const hasCompleteEducationEntry = formData.educationHistory.some(
                e => e.institution.trim() && e.degree.trim() && e.datesAttended.trim()
            );
            if (!hasCompleteEducationEntry) return 'Please add at least one complete education entry (institution, degree, and dates attended).';
        }
        if (step === 3) {
            if (!formData.jobTitles.trim()) return 'Please enter your job title(s).';
            if (!formData.minSalaryExpectation.trim()) return 'Please enter your minimum salary expectation.';
            if (!formData.sharedEmail.trim() || !/\S+@\S+\.\S+/.test(formData.sharedEmail)) return 'A valid shared email address is required.';
            if (!formData.sharedPassword || formData.sharedPassword.length < 6) return 'Password must be at least 6 characters.';
            if (!formData.commsEmail.trim() || !/\S+@\S+\.\S+/.test(formData.commsEmail)) return 'A valid primary communications email is required.';
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

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="intake-overlay">
            <div className="intake-container">
                {onClose && (
                    <button className="intake-close" onClick={onClose} aria-label="Close and finish later">✕</button>
                )}
                {/* Header */}
                <div className="intake-header">
                    <OnboardingProgress currentStage={stageForOnboardingStep(step)} />
                    <h2 className="intake-title">Complete Your Onboarding</h2>
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

                    {step === 1 && (
                        <div className="intake-fields">
                            <div className="intake-field">
                                <label>Full Name <span className="req">*</span></label>
                                <input type="text" value={formData.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Jane Doe" />
                            </div>
                            <div className="intake-field">
                                <label>Who Referred You?</label>
                                <input type="text" value={formData.referredBy} onChange={e => set('referredBy', e.target.value)} placeholder="Name or organization" />
                            </div>
                            <div className="intake-field">
                                <label>Phone Number <span className="req">*</span></label>
                                <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
                            </div>
                            <div className="intake-field">
                                <label>Country <span className="req">*</span></label>
                                <select
                                    value={formData.country}
                                    onChange={e => { set('country', e.target.value); set('addressRegion', ''); }}
                                >
                                    <option value="">Select…</option>
                                    {ONBOARDING_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            {formData.country && (
                                <>
                                    <div className="intake-field intake-field-full">
                                        <label>Street Address <span className="req">*</span></label>
                                        <input type="text" value={formData.addressStreet} onChange={e => set('addressStreet', e.target.value)} placeholder="123 Main Street, Apt 4B" />
                                    </div>
                                    <div className="intake-field">
                                        <label>City <span className="req">*</span></label>
                                        <input type="text" value={formData.addressCity} onChange={e => set('addressCity', e.target.value)} placeholder="City" />
                                    </div>
                                    <div className="intake-field">
                                        <label>{regionLabelFor(formData.country)} <span className="req">*</span></label>
                                        <select value={formData.addressRegion} onChange={e => set('addressRegion', e.target.value)}>
                                            <option value="">Select…</option>
                                            {regionOptionsFor(formData.country).map(r => <option key={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="intake-field">
                                        <label>{postalLabelFor(formData.country)} <span className="req">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.addressPostalCode}
                                            onChange={e => set('addressPostalCode', e.target.value)}
                                            placeholder={postalPlaceholderFor(formData.country)}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="intake-field">
                                <label>Sex <span className="req">*</span></label>
                                <select value={formData.sex} onChange={e => set('sex', e.target.value)}>
                                    <option value="">Select…</option>
                                    <option>Male</option>
                                    <option>Female</option>
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
                                        'Citizen',
                                        'Green Card Holder/Permanent Resident',
                                        'EAD',
                                    ].map(v => (
                                        <label key={v} className="intake-radio">
                                            <input type="radio" name="workAuth" value={v} checked={formData.workAuthorization === v} onChange={() => set('workAuthorization', v)} />
                                            {v}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="intake-field intake-field-full">
                                <label>Education History <span className="req">*</span></label>
                                <span className="intake-hint">Add every school attended, with dates. Click "Add Another" for more than one.</span>
                                {formData.educationHistory.map((edu, i) => (
                                    <div className="intake-education-row" key={i}>
                                        <input
                                            type="text"
                                            value={edu.institution}
                                            onChange={e => {
                                                const next = [...formData.educationHistory];
                                                next[i] = { ...next[i], institution: e.target.value };
                                                set('educationHistory', next);
                                            }}
                                            placeholder="School / Institution"
                                        />
                                        <input
                                            type="text"
                                            value={edu.degree}
                                            onChange={e => {
                                                const next = [...formData.educationHistory];
                                                next[i] = { ...next[i], degree: e.target.value };
                                                set('educationHistory', next);
                                            }}
                                            placeholder="Degree / Program"
                                        />
                                        <input
                                            type="text"
                                            value={edu.datesAttended}
                                            onChange={e => {
                                                const next = [...formData.educationHistory];
                                                next[i] = { ...next[i], datesAttended: e.target.value };
                                                set('educationHistory', next);
                                            }}
                                            placeholder="Dates Attended (e.g. 2018 – 2022)"
                                        />
                                        {formData.educationHistory.length > 1 && (
                                            <button
                                                type="button"
                                                className="intake-dz-remove"
                                                onClick={() => set('educationHistory', formData.educationHistory.filter((_, idx) => idx !== i))}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="intake-tc-link-btn"
                                    onClick={() => set('educationHistory', [...formData.educationHistory, { institution: '', degree: '', datesAttended: '' }])}
                                >
                                    + Add Another School
                                </button>
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
                                <label>Minimum Salary Expectation <span className="req">*</span></label>
                                <input type="text" value={formData.minSalaryExpectation} onChange={e => set('minSalaryExpectation', e.target.value)} placeholder="e.g. $70,000" />
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

                            <div className="intake-field intake-field-full">
                                <label>Primary Email Address for Communications <span className="req">*</span></label>
                                <input type="email" value={formData.commsEmail} onChange={e => set('commsEmail', e.target.value)} placeholder="you@example.com" />
                                <span className="intake-hint">
                                    The address we'll use to reach you about your job search. Can be different from your shared job-search email above.
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="intake-fields">
                            <div className="intake-field intake-field-full">
                                <label>Upload Resume <span className="req">*</span></label>
                                <div
                                    className={`intake-dropzone ${resumeFile || existingResumeFilename ? 'intake-dropzone-filled' : ''}`}
                                    onClick={() => document.getElementById('resume-input').click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => {
                                        e.preventDefault();
                                        acceptResumeFile(e.dataTransfer.files[0]);
                                    }}
                                >
                                    <input
                                        id="resume-input"
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
                                                onClick={e => { e.stopPropagation(); document.getElementById('resume-input').click(); }}
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
        </div>
    );
}

export default OnboardingForm;
