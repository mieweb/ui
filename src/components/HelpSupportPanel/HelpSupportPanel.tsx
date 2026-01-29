'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Input } from '../Input/Input';
import { Textarea } from '../Textarea/Textarea';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SupportContact {
  type: 'email' | 'phone' | 'chat';
  label: string;
  value: string;
  availability?: string;
}

export interface HelpSupportPanelProps {
  /** FAQ items to display */
  faqs?: FAQItem[];
  /** Support contact options */
  contacts?: SupportContact[];
  /** Handler for submitting a support request */
  onSubmitRequest?: (data: { subject: string; message: string; email: string }) => void;
  /** Handler for starting chat */
  onStartChat?: () => void;
  /** Whether chat is available */
  chatAvailable?: boolean;
  /** Help documentation URL */
  docsUrl?: string;
  /** Whether the form is submitting */
  isSubmitting?: boolean;
  /** Success message after submission */
  successMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * HelpSupportPanel provides help documentation, FAQs, and support contact options.
 */
export function HelpSupportPanel({
  faqs = [],
  contacts = [],
  onSubmitRequest,
  onStartChat,
  chatAvailable = false,
  docsUrl,
  isSubmitting = false,
  successMessage,
  className = '',
}: HelpSupportPanelProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    subject: '',
    message: '',
    email: '',
  });
  const [showSuccess, setShowSuccess] = React.useState(false);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitRequest) {
      onSubmitRequest(formData);
      setShowSuccess(true);
      setFormData({ subject: '', message: '', email: '' });
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  const getContactIcon = (type: SupportContact['type']) => {
    switch (type) {
      case 'email':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'phone':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Help & Support
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Find answers or get in touch with our support team
          </p>
        </div>
        <div className="flex items-center gap-3">
          {docsUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(docsUrl, '_blank')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Documentation
            </Button>
          )}
          {onStartChat && chatAvailable && (
            <Button onClick={onStartChat}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Start Chat
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="md:col-span-2 space-y-4">
          {faqs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* FAQ List */}
                {filteredFaqs.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No FAQs match your search
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredFaqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <button
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() =>
                            setExpandedFaq(
                              expandedFaq === faq.id ? null : faq.id
                            )
                          }
                        >
                          <span className="font-medium text-gray-900 dark:text-white">
                            {faq.question}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedFaq === faq.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-300">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Form */}
          {onSubmitRequest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                {showSuccess && successMessage && (
                  <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                    {successMessage}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Email
                    </label>
                    <Input
                      id="support-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="support-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <Input
                      id="support-subject"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label htmlFor="support-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Message
                    </label>
                    <Textarea
                      id="support-message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Describe your issue or question..."
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Contact Options */}
        <div className="space-y-4">
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {getContactIcon(contact.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact.label}
                      </p>
                      {contact.type === 'email' ? (
                        <a
                          href={`mailto:${contact.value}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {contact.value}
                        </a>
                      ) : contact.type === 'phone' ? (
                        <a
                          href={`tel:${contact.value}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {contact.value}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {contact.value}
                        </p>
                      )}
                      {contact.availability && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {contact.availability}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Getting Started Guide
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Video Tutorials
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Release Notes
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                System Status
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HelpSupportPanel;
