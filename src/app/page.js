"use client";
import { useState } from "react";

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("listingFormat");
  const [isLoading, setIsLoading] = useState(false);

  const handleFormat = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      
      // SAFETY CHECK 1: If Google's API crashes (like the 503 error), stop immediately
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Google API is busy");
      }
      
      const textResponse = await res.text();
      const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanedText);
      
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
      alert(`Oops! ${error.message}. Please wait a moment and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (results && results[activeTab]) {
      navigator.clipboard.writeText(results[activeTab]);
      alert("Copied raw data to clipboard! 📋");
    }
  };

  const renderSpreadsheet = (tsvText) => {
    // SAFETY CHECK 2: If there is no text to split, render nothing instead of crashing
    if (!tsvText) return null;
    
    const rows = tsvText.split('\n');
    return (
      <div className="w-full h-[540px] overflow-auto bg-gray-900 border border-gray-700 rounded-lg rounded-tl-none custom-scrollbar">
        <table className="w-full text-left border-collapse text-sm">
          <tbody className="font-mono text-gray-300">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-800 transition-colors">
                {row.split('\t').map((cell, colIndex) => (
                  <td 
                    key={colIndex} 
                    className="border border-gray-700 px-4 py-2 whitespace-pre-wrap empty:bg-gray-800/50"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen text-gray-100 p-8 font-sans relative bg-gray-950"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-black/80 z-0 backdrop-blur-[2px]"></div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden shadow-lg">
            <img 
              src="/logo.jpg" 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="font-bold text-xl text-blue-500">O</span>';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">OnShop Inventory Manager</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">1. Paste Raw List</h2>
            <textarea
              className="w-full h-[600px] p-4 bg-gray-900/90 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 shadow-inner"
              placeholder="Paste your messy inventory list here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button
              onClick={handleFormat}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg font-bold text-white shadow-lg transition-all active:scale-[0.99]"
            >
              {isLoading ? "Formatting with AI..." : "Format Inventory"}
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300 flex justify-between items-center">
              2. Get Results
            </h2>
            
            <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-t-lg border-x border-t border-gray-700 w-fit relative z-20">
              {[
                { id: "listingFormat", label: "Pcs & Condi" },
                { id: "spreadsheetFormat", label: "Spreadsheet" },
                { id: "reverseCountFormat", label: "Reverse Count" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                    activeTab === tab.id 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative shadow-xl -mt-1">
              {results && (
                <button
                  onClick={handleCopy}
                  title="Copy Data"
                  className="absolute top-4 right-6 p-2 bg-gray-700/80 hover:bg-gray-600 border border-gray-600 rounded-md text-gray-200 hover:text-white shadow backdrop-blur-sm transition-all z-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                </button>
              )}

              {!results ? (
                <textarea
                  readOnly
                  className="w-full h-[540px] p-4 bg-gray-900 border border-gray-700 rounded-lg rounded-tl-none focus:outline-none text-gray-400 font-mono text-sm whitespace-pre"
                  value="Your formatted results will appear here..."
                />
              ) : activeTab === "listingFormat" ? (
                <textarea
                  readOnly
                  className="w-full h-[540px] p-4 bg-gray-900 border border-gray-700 rounded-lg rounded-tl-none focus:outline-none text-gray-200 font-mono text-sm whitespace-pre custom-scrollbar"
                  value={results[activeTab]}
                />
              ) : (
                renderSpreadsheet(results[activeTab])
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}