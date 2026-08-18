import React from 'react';
import Reveal from './Reveal';
import './FitCheck.css';

const GOOD_FIT = [
    "Are qualified for the types of positions you're pursuing.",
    'Want help managing the time-consuming application process.',
    'Prefer targeted applications over mass applying.',
    'Have clear or reasonably defined career goals.',
    'Want visibility into where applications are being submitted.',
    'Understand that hiring decisions ultimately belong to employers.',
];

const NOT_A_FIT = [
    'Are looking for guaranteed interviews, job offers, or employment.',
    'Expect applications to be submitted indiscriminately to every available position.',
    'Want to pursue positions for which you do not meet fundamental eligibility requirements.',
    'Require Guzman Career Services to obtain or guarantee visa sponsorship or work authorization.',
    'Expect us to act as your recruiter or represent an employer.',
];

function FitCheck() {
    return (
        <section id="fit-check" className="section fit-check-section">
            <div className="container">
                <Reveal>
                    <div className="section-header text-center">
                        <h2 className="section-title">Is This Right for You?</h2>
                    </div>
                </Reveal>

                <div className="fit-check-grid">
                    <Reveal delay={0}>
                        <div className="fit-check-column fit-check-column--good">
                            <h3 className="fit-check-heading">Good fit if you:</h3>
                            <ul className="fit-check-list">
                                {GOOD_FIT.map((item, i) => (
                                    <li key={i}>
                                        <span className="fit-check-icon fit-check-icon--yes">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                    <Reveal delay={150}>
                        <div className="fit-check-column fit-check-column--bad">
                            <h3 className="fit-check-heading">May not be the right fit if you:</h3>
                            <ul className="fit-check-list">
                                {NOT_A_FIT.map((item, i) => (
                                    <li key={i}>
                                        <span className="fit-check-icon fit-check-icon--no">✕</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

export default FitCheck;
