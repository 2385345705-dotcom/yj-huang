
import React, { useState, useCallback, useRef } from 'react';
import { AppState, ShotType, StoryboardShot, SceneAnalysis } from './types';
import { DEFAULT_SHOTS, ICONS, SHOT_TYPE_LIST } from './constants';
import { analyzeImages, generateShots } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    images: [],
    sceneAnalysis: null,
    shots: [...DEFAULT_SHOTS],
    isAnalyzing: false,
    isGenerating: false,
    language: 'CN',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix for line 27: Explicitly cast Array.from result to File[] to ensure the compiler recognizes the items as Blobs for FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const loaders = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error("Failed to read file as base64 string"));
          }
        };
        reader.onerror = () => reject(new Error("File reading error"));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(loaders)
      .then(results => {
        setState(prev => ({ ...prev, images: [...prev.images, ...results] }));
      })
      .catch(err => {
        console.error(err);
        alert("Error processing images: " + err.message);
      });
  };

  const removeImage = (index: number) => {
    setState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const triggerAnalysis = async () => {
    if (state.images.length === 0) return;
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
      const analysis = await analyzeImages(state.images);
      setState(prev => ({ ...prev, sceneAnalysis: analysis, isAnalyzing: false }));
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check your configuration.");
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const triggerGenerateShots = async () => {
    if (!state.sceneAnalysis) return;
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const { shotsEN, shotsCN } = await generateShots(
        state.sceneAnalysis, 
        state.shots.map(s => s.type)
      );
      
      const newShots = state.shots.map((shot, i) => ({
        ...shot,
        descriptionEN: shotsEN[i] || "",
        descriptionCN: shotsCN[i] || "",
      }));

      setState(prev => ({ ...prev, shots: newShots, isGenerating: false }));
    } catch (err) {
      console.error(err);
      alert("Shot generation failed.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const updateShotType = (id: number, type: ShotType) => {
    setState(prev => ({
      ...prev,
      shots: prev.shots.map(s => s.id === id ? { ...s, type } : s)
    }));
  };

  const toggleLanguage = () => {
    setState(prev => ({ ...prev, language: prev.language === 'CN' ? 'EN' : 'CN' }));
  };

  const finalPrompt = () => {
    if (!state.sceneAnalysis) return "";
    
    const isCN = state.language === 'CN';
    const baseDesc = isCN ? state.sceneAnalysis.descriptionCN : state.sceneAnalysis.descriptionEN;
    
    let text = isCN 
      ? `根据（${baseDesc}），生成一张具有凝聚力的（3*3）网格图像，包含在同一个环境中的（9）个不同的摄像机镜头，严格保持人物或者物体，还有光线服装的一致性，8K分辨率，（16:9）画幅。\n`
      : `Based on (${baseDesc}), generate a cohesive (3*3) grid image containing (9) different camera shots in the same environment, strictly maintaining character/object, lighting, and clothing consistency, 8K resolution, (16:9) aspect ratio.\n`;

    state.shots.forEach((shot, i) => {
      const desc = isCN ? shot.descriptionCN : shot.descriptionEN;
      const typeStr = isCN ? shot.type : shot.type.split('(')[0].trim();
      text += `镜头${(i + 1).toString().padStart(2, '0')}: ${typeStr} - ${desc}\n`;
    });

    return text;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt());
    alert("Prompt copied!");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 flex items-center justify-center gap-3">
          {ICONS.camera} AI Storyboard Grid Studio
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Generate consistent 3x3 cinematography grids. Perfect for Midjourney, Stable Diffusion, and Veo.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Upload & Analysis */}
        <div className="lg:col-span-1 space-y-6">
          <section className="glass-card p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {ICONS.upload} Reference Images
            </h2>
            <div 
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*"
              />
              <div className="text-slate-400 text-3xl mb-2">{ICONS.upload}</div>
              <p className="text-sm font-medium text-slate-600">Click to upload reference photos</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
            </div>

            {state.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {state.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      {ICONS.trash}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={triggerAnalysis}
              disabled={state.images.length === 0 || state.isAnalyzing}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {state.isAnalyzing ? ICONS.spinner : ICONS.magic}
              {state.isAnalyzing ? "Analyzing Scene..." : "Extract Scene Context"}
            </button>
          </section>

          {state.sceneAnalysis && (
            <section className="glass-card p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500 animate-in fade-in slide-in-from-left-4 duration-500">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-2">Base Description (Context)</h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed italic border-b border-slate-100 pb-2">"{state.sceneAnalysis.descriptionCN}"</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">"{state.sceneAnalysis.descriptionEN}"</p>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Shot Config & Output */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {ICONS.camera} 3x3 Grid Configuration
              </h2>
              <button 
                onClick={triggerGenerateShots}
                disabled={!state.sceneAnalysis || state.isGenerating}
                className="py-2 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center gap-2"
              >
                {state.isGenerating ? ICONS.spinner : ICONS.magic}
                Generate Storyboard Details
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {state.shots.map((shot, idx) => (
                <div key={shot.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Shot {idx + 1}</span>
                  </div>
                  <select 
                    value={shot.type}
                    onChange={(e) => updateShotType(shot.id, e.target.value as ShotType)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500"
                  >
                    {SHOT_TYPE_LIST.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="mt-2 min-h-[40px]">
                    {shot.descriptionCN ? (
                      <p className="text-[10px] text-slate-600 line-clamp-3 leading-tight">{shot.descriptionCN}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Waiting for generation...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prompt Result Section */}
          <section className="glass-card p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-700">
                {ICONS.magic} Generated Master Prompt
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  {ICONS.language} {state.language === 'CN' ? '切换英文 (EN)' : 'Switch to CN'}
                </button>
                <button 
                  onClick={copyToClipboard}
                  disabled={!state.sceneAnalysis}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {ICONS.copy} Copy Prompt
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-300 p-6 rounded-xl font-mono text-sm leading-relaxed overflow-auto max-h-[400px]">
              {!state.sceneAnalysis ? (
                <div className="text-slate-600 italic">Upload an image and analyze it to start...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{finalPrompt()}</pre>
              )}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-100 p-2 rounded-lg">
              {ICONS.info} <span>Tip: Use this prompt in Midjourney or Stable Diffusion for the best 3x3 layout consistency.</span>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Actions for Mobile-First experience */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 lg:hidden z-50">
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
          >
            {ICONS.upload} Photo
          </button>
          <button 
            onClick={triggerAnalysis}
            disabled={state.images.length === 0 || state.isAnalyzing}
            className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm px-6"
          >
            {state.isAnalyzing ? ICONS.spinner : "Analyze"}
          </button>
          {state.sceneAnalysis && (
            <button 
              onClick={copyToClipboard}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm"
            >
              {ICONS.copy}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
