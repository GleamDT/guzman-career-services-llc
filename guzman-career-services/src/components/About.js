import React from 'react';
import './About.css';

function About() {
    return (
        <section id="about" className="section">
            <div className="container">
                <div className="about-content">
                    <div className="about-text">
                        <h2 className="about-title">About Guzman Career Services</h2>
                        <div className="about-divider"></div>
                        <p className="about-paragraph">
                            At Guzman Career Services, we are dedicated to empowering professionals
                            to achieve their career aspirations through expert guidance and personalized support.
                        </p>
                        <p className="about-paragraph">
                            With over a decade of experience in career services, our team of certified career
                            specialists understands the complexities of today's job market. We combine industry
                            expertise with proven strategies to help our clients stand out in competitive fields.
                        </p>
                        <p className="about-paragraph">
                            Our mission is simple: to provide professional, confidential, and results-driven
                            career services that transform job searches into successful career moves. We believe
                            in building lasting relationships with our clients, supporting them not just in
                            landing their next job, but in achieving long-term career success.
                        </p>
                        <div className="about-values">
                            <div className="value-item">
                                <div className="value-icon">🎯</div>
                                <div className="value-text">
                                    <h4>Results-Driven</h4>
                                    <p>Focused on measurable outcomes and your success</p>
                                </div>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">🔒</div>
                                <div className="value-text">
                                    <h4>Confidential</h4>
                                    <p>Your privacy and trust are our top priorities</p>
                                </div>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">⭐</div>
                                <div className="value-text">
                                    <h4>Professional</h4>
                                    <p>Highest standards of service and expertise</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="about-image">
                        <div className="image-placeholder">
                            <div className="placeholder-content">
                                <span className="placeholder-icon">💼</span>
                                <p>Professional Career Excellence</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default About;
