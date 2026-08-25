import React from 'react';
import { Clock } from 'lucide-react';
import Reveal from './Reveal';
import './Problem.css';

function Problem() {
    return (
        <section id="problem" className="problem-section">
            <div className="problem-icon-decoration">
                <Clock strokeWidth={1} />
            </div>
            <div className="container">
                <Reveal>
                    <div className="problem-content">
                        <h2 className="problem-title">
                            Your job search shouldn't become your second full-time job.
                        </h2>
                        <p className="problem-text">
                            Job searching has become work in itself. Professionals can spend hours every week
                            finding openings, evaluating requirements, completing repetitive applications and
                            keeping track of submissions.
                        </p>
                        <p className="problem-text problem-text--emphasis">
                            Guzman Career Services was built to take that workload off the job seeker's plate.
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

export default Problem;
