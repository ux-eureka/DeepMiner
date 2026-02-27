import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useChatFlow } from '../../hooks/useChatFlow';

export const CreateModeModal: React.FC = () => {
  const { state, dispatch } = useChatFlow();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!state.isCreateModalOpen) return null;

  const handleSave = () => {
    try {
      if (!jsonInput.trim()) {
        throw new Error("Input cannot be empty");
      }
      const parsed = JSON.parse(jsonInput);
      // Validate structure roughly
      if (!parsed.mode_id || !parsed.phases) {
          throw new Error("Invalid JSON structure. Missing mode_id or phases.");
      }
      
      // Save logic (mock)
      console.log("Saved Mode:", parsed);
      // Ideally we would add to custom modes state
      
      dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: false });
      setJsonInput('');
      setError(null);
    } catch {
      setError("Please enter a valid JSON format supported by the system.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-lg font-bold text-zinc-800">Create Diagnostic Mode</h3>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: false })}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Configuration JSON
            </label>
            <div className="relative">
                <textarea
                value={jsonInput}
                onChange={(e) => {
                    setJsonInput(e.target.value);
                    if (error) setError(null);
                }}
                placeholder={`{
  "mode_id": "custom_mode",
  "mode_name": "My Custom Mode",
  "phases": {
    "1": { "title": "Phase 1", "questions": ["Question 1"] }
  }
}`}
                className="w-full h-64 p-4 font-mono text-xs bg-zinc-50 border border-zinc-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none outline-none"
                />
            </div>
            {error && (
              <div className="flex items-center mt-3 text-red-600 text-xs font-medium animate-pulse">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                {error}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end px-6 py-4 bg-zinc-50 border-t border-zinc-200 gap-3">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: false })}
            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors shadow-sm"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
