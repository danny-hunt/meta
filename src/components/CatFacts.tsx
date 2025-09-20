"use client";

import { useState } from "react";

interface CatFact {
  fact: string;
}

export default function CatFacts() {
  const [facts, setFacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSingleCatFact = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call - in a real implementation, this would call your backend
      // that uses the cat-facts MCP server
      const response = await fetch("/api/cat-facts/single");

      if (!response.ok) {
        throw new Error("Failed to fetch cat fact");
      }

      const data = await response.json();
      setFacts((prev) => [data.fact, ...prev.slice(0, 4)]); // Keep last 5 facts
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback: add a demo fact for UI purposes
      setFacts((prev) => ["Cats have been companions to humans for over 4,000 years! 🐱", ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMultipleCatFacts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call for multiple facts
      const response = await fetch("/api/cat-facts/multiple?limit=3");

      if (!response.ok) {
        throw new Error("Failed to fetch cat facts");
      }

      const data = await response.json();
      setFacts((prev) => [...data.facts, ...prev.slice(0, 2)]); // Keep last 5 facts
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Fallback: add demo facts for UI purposes
      const demoFacts = [
        'A group of cats is called a "clowder" 🐾',
        "Cats spend 70% of their lives sleeping 😴",
        "A cat's purr vibrates at 20-140 Hz, which can help heal bones! 🦴",
      ];
      setFacts((prev) => [...demoFacts, ...prev.slice(0, 2)]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFacts = () => {
    setFacts([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">🐱 Cat Facts</h3>
        <p className="text-sm text-gray-700">Discover amazing facts about our feline friends!</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={getSingleCatFact}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {isLoading ? "⏳ Loading..." : "🎯 Get One Fact"}
        </button>
        
        <button
          onClick={getMultipleCatFacts}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 px-3 rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {isLoading ? "⏳ Loading..." : "📚 Get 3 Facts"}
        </button>
      </div>

      {/* Clear Button */}
      {facts.length > 0 && (
        <button
          onClick={clearFacts}
          className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 px-3 rounded-lg hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-xs font-medium shadow-md transform hover:scale-105 transition-all duration-200"
        >
          🗑️ Clear All Facts
        </button>
      )}

      {/* Facts Display */}
      {facts.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg border border-blue-200">📖 Cat Facts ({facts.length}):</div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {facts.map((fact, index) => (
              <div
                key={index}
                className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-sm animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-lg">🐱</span>
                  <p className="text-sm text-gray-800 leading-relaxed">{fact}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">Fact #{facts.length - index}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {facts.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🐾</div>
          <p className="text-sm">No cat facts yet. Click a button above to get started!</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-purple-700 font-medium">Fetching cat facts...</span>
          </div>
        </div>
      )}
    </div>
  );
}
