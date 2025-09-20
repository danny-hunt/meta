"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import VoiceCommand from "../components/VoiceCommand";
import CatFacts from "@/components/CatFacts";

export default function Home() {
  const [input, setInput] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submissionType, setSubmissionType] = useState<"implement" | "kanban">("implement");
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showElevenLabs, setShowElevenLabs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showElevenLabs');
      return saved ? JSON.parse(saved) : true; // Default to true (show by default)
    }
    return true;
  });
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // WebSocket connection management
  useEffect(() => {
    if (webhookUrl) {
      // Extract base URL from webhook URL
      const baseUrl = webhookUrl.replace("/webhook", "");

      // Disconnect existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Create new socket connection
      socketRef.current = io(baseUrl, {
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        setIsConnected(true);
        setLogs((prev) => [...prev, "🔗 Connected to server"]);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        setLogs((prev) => [...prev, "❌ Disconnected from server"]);
      });

      socketRef.current.on("cursor_agent_start", (data) => {
        setIsProcessing(true);
        setLogs((prev) => [...prev, `🚀 ${data.message}`]);
      });

      socketRef.current.on("cursor_agent_output", (data) => {
        setLogs((prev) => [...prev, data.line]);
      });

      socketRef.current.on("cursor_agent_complete", (data) => {
        setIsProcessing(false);
        setLogs((prev) => [...prev, `✅ Process completed with exit code: ${data.returncode}`]);
      });

      socketRef.current.on("cursor_agent_error", (data) => {
        setIsProcessing(false);
        setLogs((prev) => [...prev, `❌ Error: ${data.error}`]);
      });

      socketRef.current.on("connected", (data) => {
        setLogs((prev) => [...prev, `✅ ${data.message}`]);
      });

      socketRef.current.on("processing_started", (data) => {
        setLogs((prev) => [...prev, `🚀 ${data.message}`]);
      });

      socketRef.current.on("error", (data) => {
        setIsProcessing(false);
        setLogs((prev) => [...prev, `❌ Server Error: ${data.error}`]);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [webhookUrl]);

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  const handleElevenLabsToggle = (checked: boolean) => {
    setShowElevenLabs(checked);
    localStorage.setItem('showElevenLabs', JSON.stringify(checked));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setMessage("Please enter some text");
      return;
    }

    if (!webhookUrl.trim()) {
      setMessage("Please enter the webhook URL");
      return;
    }

    if (!socketRef.current || !isConnected) {
      setMessage("❌ Not connected to server. Please check your connection.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setLogs([]); // Clear previous logs

    try {
      // Use Socket.IO to send the processing request
      socketRef.current.emit('start_processing', {
        message: input,
        submissionType: submissionType,
      });

      setMessage("✅ Message sent successfully! Processing started.");
      setInput("");
    } catch (error) {
      setMessage(`❌ Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Placeholder Content */}
      <div className="flex-1 bg-gray-50 p-8 flex flex-col justify-center items-center">
        <div className="max-w-2xl text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Classic Spaghetti Recipe</h1>
            <p className="text-xl text-gray-600">A delicious homemade spaghetti that will satisfy your cravings</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ingredients & Instructions</h2>
            <p className="text-gray-600 mb-4">
              This classic spaghetti recipe combines simple ingredients to create a comforting and flavorful dish that's
              perfect for any occasion.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">🍝 Ingredients</h3>
                <p className="text-sm text-gray-600">
                  1 lb spaghetti, 1 lb ground beef, 1 onion, 3 cloves garlic, 2 cans crushed tomatoes
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">🧄 Seasonings</h3>
                <p className="text-sm text-gray-600">Salt, pepper, oregano, basil, red pepper flakes, olive oil</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">🔥 Cooking Steps</h3>
                <p className="text-sm text-gray-600">
                  Brown meat, sauté onions & garlic, add tomatoes, simmer 30 minutes
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">⏱️ Total Time</h3>
                <p className="text-sm text-gray-600">45 minutes prep to plate - perfect for weeknight dinners</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Buon appetito! Enjoy this classic Italian-American comfort food.</p>
          </div>

          {/* Cat Facts Section */}
          {/* <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 pt-4 p-4 rounded-lg">
            <CatFacts />
          </div> */}
        </div>
      </div>

      {/* Right Panel - User Controls */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Control Panel</h2>
            <p className="text-sm text-gray-600">Configure and send your requests</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Submission Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="submissionType"
                    value="implement"
                    checked={submissionType === "implement"}
                    onChange={(e) => setSubmissionType(e.target.value as "implement" | "kanban")}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Implement directly</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="submissionType"
                    value="kanban"
                    checked={submissionType === "kanban"}
                    onChange={(e) => setSubmissionType(e.target.value as "implement" | "kanban")}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Add to kanban</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Settings</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showElevenLabs}
                    onChange={(e) => handleElevenLabsToggle(e.target.checked)}
                    className="mr-2 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Show ElevenLabs Voice Commands</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                required
              />
            </div>

            {/* Voice Command Section */}
            {showElevenLabs && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">🎤 Voice Commands</h3>
                <VoiceCommand onTranscript={handleVoiceTranscript} disabled={isSubmitting || isProcessing} />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting
                ? "Sending..."
                : submissionType === "implement"
                ? "Send to Cursor Agent (Implement)"
                : "Send to Cursor Agent (Add to Kanban)"}
            </button>
          </form>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {isProcessing && <span className="text-blue-600">• Processing...</span>}
          </div>

          {/* Logs Display */}
          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-xs max-h-64 overflow-y-auto">
              <div className="text-gray-400 mb-2 text-xs">Cursor Agent Output:</div>
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
