import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import rocks from "./assets/two.jpg";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the new structured data from location.state
  const { label, confidence, analysisData, imageBase64 } = location.state || {
    label: "Unknown",
    confidence: "0%",
    analysisData: null,
    imageBase64: null
  };

  const [userId, setUserId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'success', 'error'
  const [saveError, setSaveError] = useState('');
  const [expandedMetric, setExpandedMetric] = useState(null); // Track which metric is expanded

  // Extract numeric confidence for visual bar
  const confidenceValue = parseFloat(confidence) || 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!userId) {
      setSaveError("User not logged in.");
      setSaveStatus('error');
      return;
    }
    if (!label || label === "Unknown" || !analysisData) {
      setSaveError("Cannot save incomplete analysis results.");
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    setSaveStatus('');
    setSaveError('');

    try {
      const analysesCollectionPath = `artifacts/${appId}/users/${userId}/analyses`;
      const analysesCol = collection(db, analysesCollectionPath);

      // Save the structured data AND the base64 image
      await addDoc(analysesCol, {
        predicted_class: label,
        confidence: confidence,
        analysis_data: analysisData,
        image_base64: imageBase64, // Saving the image string directly
        timestamp: serverTimestamp(),
        // Also save a readable date string for easy UI rendering later
        date_saved: new Date().toISOString()
      });

      setSaveStatus('success');
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (err) {
      console.error("Error saving analysis:", err);
      setSaveError("Failed to save analysis. Please try again.");
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  // Helper function to color code erosion risk
  const getErosionColor = (risk) => {
    if (!risk) return 'bg-surface-800 text-surface-400';
    const lowerRisk = risk.toLowerCase();
    if (lowerRisk.includes('low')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (lowerRisk.includes('med')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (lowerRisk.includes('high')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-surface-800 text-surface-400';
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-surface-950 overflow-auto">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity"
        style={{ backgroundImage: `url(${rocks})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-surface-950/60 via-surface-950/80 to-surface-950" />

      {/* Navbar */}
      <header className="relative z-20 flex justify-between items-center px-8 py-4 bg-surface-900/60 backdrop-blur-md border-b border-surface-700/50 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="p-2 text-surface-300 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Analysis Report</h1>
          </div>
        </div>

        <nav className="flex items-center space-x-2">
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-medium text-surface-200 hover:text-white hover:bg-surface-800/50 rounded-lg transition-all">Dashboard</button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-surface-200 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">Logout</button>
        </nav>
      </header>

      <main className="relative z-10 flex-grow max-w-4xl w-full mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Understanding Ground Terrain</h2>
            <p className="text-sm text-surface-400">Generated evaluation of your image</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || saveStatus === 'success'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg ${isSaving
              ? 'bg-surface-800 text-surface-400 cursor-not-allowed'
              : saveStatus === 'success'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20 hover:shadow-brand-500/40 transform hover:-translate-y-0.5'
              }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
            ) : saveStatus === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            )}
            {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved to Dashboard' : 'Save Report'}
          </button>
        </div>

        {saveStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Classification Stats Card */}
          <div className="lg:col-span-1 space-y-5">
            {/* Main Identification */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mr-8 -mt-8" />

              <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center mb-3 border border-brand-500/30 relative z-10">
                <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-1 relative z-10">Detected Class</h3>
              <p className="text-2xl font-bold text-white mb-4 capitalize relative z-10">{label}</p>

              <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-end">
                  <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider">Model Confidence</h3>
                  <span className="text-lg font-mono font-bold text-brand-400">{confidence}</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden border border-surface-700">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full relative"
                    style={{ width: `${confidenceValue}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Image Thumbnail (If available) */}
            {imageBase64 && (
              <div className="glass-panel p-3 rounded-2xl bg-surface-900/40 border-surface-700/30 group">
                <img src={imageBase64} alt="Analyzed Terrain" className="w-full h-40 object-cover rounded-xl border border-surface-700 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          {/* Detailed LLM Structured Data Cards */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-6 rounded-2xl h-full border-brand-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col">

              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-surface-800">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Agronomist & Geology Report</h2>
                </div>
              </div>

              {analysisData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">

                  {/* Left Column: Metrics */}
                  <div className="space-y-4">
                    {/* Permeability - Expandable */}
                    <div
                      className="cursor-pointer rounded-xl border border-surface-700/50 hover:border-blue-500/30 transition-all p-3"
                      onClick={() => setExpandedMetric(expandedMetric === 'permeability' ? null : 'permeability')}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                          Soil Permeability
                          <svg className={`w-3 h-3 text-surface-500 transition-transform ${expandedMetric === 'permeability' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </h3>
                        <span className="text-white font-bold">{analysisData.soil_permeability}/100</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden border border-surface-700">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysisData.soil_permeability}%` }} />
                      </div>
                      {expandedMetric === 'permeability' && analysisData.soil_permeability_reason && (
                        <p className="mt-3 text-xs text-surface-300 bg-surface-800/50 p-2.5 rounded-lg border border-surface-700/50 animate-fade-in">
                          {analysisData.soil_permeability_reason}
                        </p>
                      )}
                    </div>

                    {/* Construction Difficulty - Expandable */}
                    <div
                      className="cursor-pointer rounded-xl border border-surface-700/50 hover:border-orange-500/30 transition-all p-3"
                      onClick={() => setExpandedMetric(expandedMetric === 'construction' ? null : 'construction')}
                    >
                      <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          Construction Difficulty
                          <svg className={`w-3 h-3 text-surface-500 transition-transform ${expandedMetric === 'construction' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </h3>
                        <span className="text-white font-bold">{analysisData.construction_difficulty}/100</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-800 rounded-full overflow-hidden border border-surface-700">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${analysisData.construction_difficulty}%` }} />
                      </div>
                      {expandedMetric === 'construction' && analysisData.construction_difficulty_reason && (
                        <p className="mt-3 text-xs text-surface-300 bg-surface-800/50 p-2.5 rounded-lg border border-surface-700/50 animate-fade-in">
                          {analysisData.construction_difficulty_reason}
                        </p>
                      )}
                    </div>

                    {/* Erosion Risk - Expandable */}
                    <div
                      className="cursor-pointer rounded-xl border border-surface-700/50 hover:border-red-500/30 transition-all p-3"
                      onClick={() => setExpandedMetric(expandedMetric === 'erosion' ? null : 'erosion')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-surface-300 flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Erosion Risk Factor
                          <svg className={`w-3 h-3 text-surface-500 transition-transform ${expandedMetric === 'erosion' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </h3>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getErosionColor(analysisData.erosion_risk)}`}>
                          {analysisData.erosion_risk} Risk
                        </span>
                      </div>
                      {expandedMetric === 'erosion' && analysisData.erosion_risk_reason && (
                        <p className="mt-2 text-xs text-surface-300 bg-surface-800/50 p-2.5 rounded-lg border border-surface-700/50 animate-fade-in">
                          {analysisData.erosion_risk_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Text & Lists */}
                  <div className="space-y-6 flex flex-col justify-between">

                    {/* Summary */}
                    <div className="bg-brand-500/5 border border-brand-500/20 p-3 rounded-xl">
                      <h3 className="text-sm font-medium text-brand-400 mb-2 uppercase tracking-wide">Expert Summary</h3>
                      <p className="text-surface-200 text-sm leading-relaxed">
                        {analysisData.expert_summary}
                      </p>
                    </div>

                    {/* Crops */}
                    <div>
                      <h3 className="text-sm font-medium text-surface-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        Optimal Land Use / Crops
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.recommended_crops && analysisData.recommended_crops.length > 0 ? (
                          analysisData.recommended_crops.map((crop, idx) => (
                            <span key={idx} className="px-3 py-1 bg-surface-800 border border-surface-600 rounded-lg text-sm text-surface-200 shadow-sm">
                              {crop}
                            </span>
                          ))
                        ) : (
                          <p className="text-surface-500 text-sm italic">No recommendations available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow text-surface-500 py-12">
                  <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p>Analysis data could not be loaded.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Analysis;
