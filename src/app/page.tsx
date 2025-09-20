'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [submissionType, setSubmissionType] = useState<'implement' | 'kanban'>('implement');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setMessage('Please enter some text');
      return;
    }

    if (!webhookUrl.trim()) {
      setMessage('Please enter the webhook URL');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`${webhookUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          submissionType: submissionType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Message sent successfully! Processing started.');
        setInput('');
      } else {
        setMessage(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cursor Agent Interface
          </h1>
          <p className="text-gray-600">
            Enter your request and webhook URL to send it to cursor-agent
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-ngrok-url.ngrok.io"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Submission Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="implement"
                  checked={submissionType === 'implement'}
                  onChange={(e) => setSubmissionType(e.target.value as 'implement' | 'kanban')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Send to cursor-agent to implement
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="submissionType"
                  value="kanban"
                  checked={submissionType === 'kanban'}
                  onChange={(e) => setSubmissionType(e.target.value as 'implement' | 'kanban')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Send to cursor-agent to add to vibe-kanban (and start)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Your Request
            </label>
            <textarea
              id="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want cursor-agent to do..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
{isSubmitting ? 'Sending...' : submissionType === 'implement' ? 'Send to Cursor Agent (Implement)' : 'Send to Cursor Agent (Add to Kanban)'}
          </button>
        </form>

        {message && (
          <div className={`p-3 rounded-md ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Run the Python server: <code className="bg-gray-100 px-1 rounded">python server.py</code></li>
            <li>Copy the ngrok URL from the server output</li>
            <li>Paste it in the Webhook URL field above</li>
            <li>Enter your request and submit</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
