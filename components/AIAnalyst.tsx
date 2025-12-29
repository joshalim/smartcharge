
import React from 'react';
import { getAIInsights } from '../services/geminiService';
import { Charger, OCPPLog } from '../types';
import { BrainCircuit, Sparkles, Loader2, Info } from 'lucide-react';

interface AIAnalystProps {
  chargers: Charger[];
  logs: OCPPLog[];
}

const AIAnalyst: React.FC<AIAnalystProps> = ({ chargers, logs }) => {
  const [insight, setInsight] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    const result = await getAIInsights(chargers, logs);
    setInsight(result || 'Unable to generate analysis.');
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-xl shadow-blue-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">VoltAdmin AI Insights</h2>
            <p className="text-blue-100 opacity-80">Autonomous network diagnostics and optimization</p>
          </div>
        </div>
        <p className="mb-6 text-lg leading-relaxed text-blue-50">
          Our AI analyzes your chargers' telemetry, transaction patterns, and OCPP message health to provide predictive maintenance and performance summaries.
        </p>
        <button 
          onClick={generateReport}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {insight ? 'Refresh Analysis' : 'Run Full Diagnostic'}
        </button>
      </div>

      {insight ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Info className="text-blue-500" size={20} />
              Current Network Health Summary
            </h3>
            <span className="text-xs text-slate-400 font-medium">Generated just now • Powered by Gemini</span>
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg">
              {insight}
            </div>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
             <BrainCircuit className="mx-auto text-slate-300 mb-4" size={48} />
             <p className="text-slate-400 font-medium">Click above to start a deep scan of your network.</p>
          </div>
        )
      )}
    </div>
  );
};

export default AIAnalyst;
