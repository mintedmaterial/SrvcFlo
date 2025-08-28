'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  start: string;
  end: string;
  display: string;
}

export default function ScheduleAppointment() {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: '',
  });
  const [scheduled, setScheduled] = useState(false);
  
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);
  
  const fetchAvailableSlots = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/calendar/availability?date=${date}`);
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.availableSlots);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSchedule = async () => {
    if (!selectedSlot || !formData.name || !formData.email) {
      alert('Please fill in all required fields and select a time slot.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datetime: selectedSlot.start,
          duration: 30, // 30 minutes
          attendeeEmail: formData.email,
          attendeeName: formData.name,
          notes: formData.notes,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setScheduled(true);
      } else {
        alert('Failed to schedule appointment: ' + data.error);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (scheduled) {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Appointment Scheduled! 📅
        </h3>
        <p className="text-green-700 mb-4">
          Your consultation with ServiceFlow AI has been scheduled for {selectedSlot?.display} on {new Date(selectedDate).toLocaleDateString()}.
        </p>
        <p className="text-sm text-green-600">
          Check your email for confirmation and meeting details.
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h3 className="text-xl font-semibold mb-4">Schedule Your ServiceFlow AI Consultation</h3>
      
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Select Date
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time Slots
          </label>
          {loading ? (
            <p className="text-gray-500">Loading available times...</p>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 text-sm border rounded ${
                    selectedSlot === slot
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {slot.display}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No available slots for this date.</p>
          )}
        </div>
      )}
      
      {selectedSlot && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Tell us about your business and what you'd like to discuss..."
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedSlot.display} on {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
          
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Consultation'}
          </button>
        </div>
      )}
    </div>
  );
}