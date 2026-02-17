import React, { useState } from 'react';
import './Contact.css';

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Form submission logic would go here
        alert('Thank you for your interest! We will contact you shortly.');
        setFormData({
            name: '',
            email: '',
            phone: '',
            service: '',
            message: ''
        });
    };

    return (
        <section id="contact" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Contact Us</h2>
                    <p className="section-subtitle">
                        We are available to respond to all inquiries and requests from 9:00 AM - 2:00 PM CST Monday - Friday (Except on public holidays)
                    </p>
                </div>
                <div className="contact-content">
                    <div className="contact-info">
                        <h3 className="contact-info-title">Contact Information</h3>
                        <div className="contact-item">
                            <div className="contact-icon">📧</div>
                            <div className="contact-details">
                                <div className="contact-label">Email</div>
                                <a href="mailto:info@guzmancareerservice.com" className="contact-value">
                                    info@guzmancareerservice.com
                                </a>
                            </div>
                        </div>
                        <div className="contact-item">
                            <div className="contact-icon">🕒</div>
                            <div className="contact-details">
                                <div className="contact-label">Business Hours</div>
                                <div className="contact-value">
                                    Monday - Friday: 9:00 AM - 2:00 PM CST<br />
                                    (Except on public holidays)
                                </div>
                            </div>
                        </div>
                        <div className="contact-social">
                            <h4>Follow Us</h4>
                            <div className="social-links">
                                <a href="#facebook" className="social-link" aria-label="Facebook">
                                    <span>f</span>
                                </a>
                                <a href="#twitter" className="social-link" aria-label="Twitter">
                                    <span>𝕏</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="service">Service of Interest *</label>
                            <select
                                id="service"
                                name="service"
                                value={formData.service}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a service</option>
                                <option value="job-application">Job Application Assistance</option>
                                <option value="resume">Resume & CV Optimization</option>

                                <option value="cover-letter">Cover Letter Writing</option>
                                <option value="interview">Interview Coaching</option>
                                <option value="consulting">Career Consulting</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="message">Message *</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="5"
                                placeholder="Tell us about your career goals and how we can help..."
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg form-submit">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default Contact;
