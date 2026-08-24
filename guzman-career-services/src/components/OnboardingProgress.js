import React from 'react';
import './OnboardingProgress.css';

export const ONBOARDING_STAGES = [
    'Create Account',
    'Complete Profile',
    'Define Job Criteria',
    'Choose Service',
    'Payment/Agreement',
];

// Onboarding-form internal step (1-5: Personal Info, Background, Professional,
// Resume, Agreement) mapped onto the 5 macro stages shown here.
export function stageForOnboardingStep(step) {
    if (step <= 2) return 2; // Personal Info + Background -> Complete Profile
    if (step === 3) return 3; // Professional -> Define Job Criteria
    return 4; // Resume + Agreement -> Choose Service
}

// variant "horizontal" (default) is the flat top-of-form bar used on the
// onboarding wizard and payment pages. variant "vertical" is the slanted
// staircase used in Login.js's dark left brand panel on the signup screen —
// each step is nudged further right than the last for an ascending, diagonal feel.
function OnboardingProgress({ currentStage, variant = 'horizontal' }) {
    return (
        <ol className={`ob-progress ob-progress--${variant}`} aria-label="Onboarding progress">
            {ONBOARDING_STAGES.map((label, i) => {
                const stage = i + 1;
                const state = stage < currentStage ? 'done' : stage === currentStage ? 'active' : 'upcoming';
                return (
                    <li
                        key={label}
                        className={`ob-progress-step ob-progress-step--${state}`}
                        style={variant === 'vertical' ? { marginLeft: `${i * 1.1}rem` } : undefined}
                    >
                        <span className="ob-progress-dot">{state === 'done' ? '✓' : stage}</span>
                        <span className="ob-progress-label">{label}</span>
                        {variant === 'horizontal' && stage < ONBOARDING_STAGES.length && (
                            <span className="ob-progress-connector" />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

export default OnboardingProgress;
