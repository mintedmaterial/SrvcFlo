'use client';

import { useState } from 'react';

interface WaitlistFormData {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  businessType: string;
  currentChallenges?: string;
  interestedPackage?: string;
  estimatedRevenue?: string;
}

export default function WaitlistForm() {
  const [formData, setFormData] = useState<WaitlistFormData>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    currentChallenges: '',
    interestedPackage: '',
    estimatedRevenue: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setWaitlistPosition(data.position);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Welcome to ServiceFlow AI! 🎉
        </h3>
        <p className="text-green-700 mb-4">
          You're #{waitlistPosition} on our waitlist. We'll notify you when your access is ready!
        </p>
        <p className="text-sm text-green-600">
          Check your email for confirmation and next steps.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Business Name *
        </label>
        <input
          type="text"
          id="businessName"
          required
          value={formData.businessName}
          onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
          Your Name *
        </label>
        <input
          type="text"
          id="ownerName"
          required
          value={formData.ownerName}
          onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
          Business Type *
        </label>
        <select
          id="businessType"
          required
          value={formData.businessType}
          onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select your business type</option>
          <option value="contractor">General Contractor</option>
          <option value="plumber">Plumber</option>
          <option value="electrician">Electrician</option>
          <option value="roofer">Roofer</option>
          <option value="hvac">HVAC</option>
          <option value="landscaping">Landscaping</option>
          <option value="cleaning">Cleaning Service</option>
          <option value="handyman">Handyman</option>
          <option value="other">Other Service Business</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="currentChallenges" className="block text-sm font-medium text-gray-700">
          Current Business Challenges
        </label>
        <textarea
          id="currentChallenges"
          rows={3}
          value={formData.currentChallenges}
          onChange={(e) => setFormData(prev => ({ ...prev, currentChallenges: e.target.value }))}
          placeholder="What challenges are you facing in your business?"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="interestedPackage" className="block text-sm font-medium text-gray-700">
          Interested Package
        </label>
        <select
          id="interestedPackage"
          value={formData.interestedPackage}
          onChange={(e) => setFormData(prev => ({ ...prev, interestedPackage: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select package (optional)</option>
          <option value="starter">Starter - $29/month</option>
          <option value="professional">Professional - $99/month</option>
          <option value="enterprise">Enterprise - $299/month</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="estimatedRevenue" className="block text-sm font-medium text-gray-700">
          Estimated Annual Revenue
        </label>
        <select
          id="estimatedRevenue"
          value={formData.estimatedRevenue}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedRevenue: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select range (optional)</option>
          <option value="under-100k">Under $100k</option>
          <option value="100k-500k">$100k - $500k</option>
          <option value="500k-1m">$500k - $1M</option>
          <option value="1m-5m">$1M - $5M</option>
          <option value="over-5m">Over $5M</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Joining Waitlist...' : 'Join Waitlist'}
      </button>
    </form>
  );
}