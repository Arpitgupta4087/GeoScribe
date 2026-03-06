import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebaseConfig';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchAnalyses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const analysesCollectionPath = `artifacts/${appId}/users/${userId}/analyses`;
        const analysesCol = collection(db, analysesCollectionPath);
        const q = query(analysesCol);
        const querySnapshot = await getDocs(q);

        const fetchedAnalyses = [];
        querySnapshot.forEach((doc) => {
          fetchedAnalyses.push({ id: doc.id, ...doc.data() });
        });

        // Basic client-side sort by timestamp descending if timestamp exists
        fetchedAnalyses.sort((a, b) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return b.timestamp.toMillis() - a.timestamp.toMillis();
        });

        setAnalyses(fetchedAnalyses);

      } catch (err) {
        console.error("Error fetching analyses:", err);
        setError("Failed to load your past analyses. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();

  }, [userId]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-surface-950 overflow-auto">
      {/* Soft Organic Accent */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="relative z-20 flex justify-between items-center px-4 md:px-8 py-3 md:py-4 bg-surface-900/60 backdrop-blur-md border-b border-surface-700/50 sticky top-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate('/home')}
            className="p-1.5 md:p-2 text-surface-300 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-sm md:text-lg font-bold text-white tracking-wide truncate max-w-[120px] xs:max-w-none">Analysis History</h1>
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-2">
          <button onClick={() => navigate('/home')} className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-surface-200 hover:text-white hover:bg-surface-800/50 rounded-lg transition-all flex items-center gap-2">
            <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden xs:inline">New Analysis</span>
            <span className="xs:hidden">New</span>
          </button>
          <button onClick={handleLogout} className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-surface-200 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2">
            <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden xs:inline">Logout</span>
          </button>
        </nav>
      </header>

      <main className="relative z-10 flex-grow max-w-6xl w-full mx-auto p-4 md:p-6 animate-fade-in">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Your Dashboard</h2>
          <p className="text-surface-400">Review your past terrain classifications and AI insights.</p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-surface-700 border-t-brand-500 rounded-full animate-spin mb-4" />
            <p className="text-surface-400 font-medium">Loading analyses...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {analyses.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-panel rounded-2xl border-dashed">
                <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-surface-700">
                  <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No analyses found</h3>
                <p className="text-surface-400 mb-6">Upload an image to perform your first terrain classification.</p>
                <button
                  onClick={() => navigate('/home')}
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-400 to-brand-500 text-brand-950 font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:from-brand-300 hover:to-brand-400 transition-all"
                >
                  Start Analysis
                </button>
              </div>
            ) : (
              analyses.map((analysis) => {
                const confValue = parseFloat(analysis.confidence) || 0;

                // Read the old format (explanation string) OR new format (analysis_data object)
                const isNewFormat = !!analysis.analysis_data;
                const summaryText = isNewFormat
                  ? analysis.analysis_data.expert_summary
                  : analysis.explanation;

                return (
                  <div
                    key={analysis.id}
                    onClick={() => setSelectedAnalysis(analysis)}
                    className="glass-card p-0 rounded-2xl cursor-pointer group flex flex-col h-72 overflow-hidden"
                  >
                    {/* Card Header with optional Image */}
                    <div className="relative h-32 w-full bg-surface-800 border-b border-surface-700">
                      {analysis.image_base64 ? (
                        <img src={analysis.image_base64} alt={analysis.predicted_class} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="text-xs font-mono font-medium text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 shadow-sm">
                          {analysis.confidence}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-white mb-2 capitalize line-clamp-1">{analysis.predicted_class}</h3>

                      {/* Tiny visual progress bar */}
                      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-brand-500 rounded-full opacity-70"
                          style={{ width: `${confValue}%` }}
                        />
                      </div>

                      <p className="text-surface-400 text-sm flex-grow line-clamp-2 leading-relaxed">
                        {summaryText}
                      </p>

                      <div className="mt-3 pt-3 border-t border-surface-800/50 flex items-center text-xs font-medium text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View Full Report</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Modal Overlay */}
      {selectedAnalysis && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedAnalysis(null)}
        >
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm" />

          <div
            className="relative glass-panel rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-surface-800">
              <div className="flex items-center gap-4">
                {selectedAnalysis.image_base64 ? (
                  <img src={selectedAnalysis.image_base64} alt={selectedAnalysis.predicted_class} className="w-12 h-12 rounded-lg object-cover border border-brand-500/30" />
                ) : (
                  <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center border border-brand-500/20">
                    <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">{selectedAnalysis.predicted_class}</h2>
                  <div className="flex items-center gap-3 text-sm text-surface-400 font-mono mt-0.5">
                    <span>Confidence: <span className="text-brand-400 font-medium">{selectedAnalysis.confidence}</span></span>
                    {selectedAnalysis.date_saved && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-surface-600" />
                        <span>{new Date(selectedAnalysis.date_saved).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAnalysis(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">

              {selectedAnalysis.analysis_data ? (
                /* NEW STRUCTURED FORMAT RENDER */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Col */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-medium text-surface-300">Soil Permeability</h3>
                        <span className="text-white font-bold">{selectedAnalysis.analysis_data.soil_permeability}/100</span>
                      </div>
                      <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden border border-surface-700">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedAnalysis.analysis_data.soil_permeability}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <h3 className="text-sm font-medium text-surface-300">Construction Difficulty</h3>
                        <span className="text-white font-bold">{selectedAnalysis.analysis_data.construction_difficulty}/100</span>
                      </div>
                      <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden border border-surface-700">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${selectedAnalysis.analysis_data.construction_difficulty}%` }} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-surface-300 mb-2">Erosion Risk</h3>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold border inline-block ${selectedAnalysis.analysis_data.erosion_risk.toLowerCase().includes('low')
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : selectedAnalysis.analysis_data.erosion_risk.toLowerCase().includes('high')
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                        {selectedAnalysis.analysis_data.erosion_risk}
                      </span>
                    </div>
                  </div>

                  {/* Right Col */}
                  <div className="space-y-5">
                    <div className="bg-surface-800/50 border border-surface-700/50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-brand-400 mb-2 uppercase tracking-wide">Expert Summary</h3>
                      <p className="text-surface-200 text-sm leading-relaxed">
                        {selectedAnalysis.analysis_data.expert_summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-surface-300 mb-3">Optimal Land Use / Crops</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.analysis_data.recommended_crops?.map((crop, idx) => (
                          <span key={idx} className="px-3 py-1 bg-surface-800 border border-surface-600 rounded-lg text-sm text-surface-200 shadow-sm">
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* OLD LEGACY FORMAT RENDER */
                <div className="prose prose-invert prose-brand max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Expert Evaluation (Legacy format)
                  </h3>
                  <div className="text-surface-200 leading-relaxed font-sans bg-surface-900/40 p-5 rounded-xl border border-surface-800">
                    {selectedAnalysis.explanation?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">
                        {paragraph.split(/(\*\*.*?\*\*)/).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-800/50 flex justify-end bg-surface-900/20">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-6 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg transition-colors font-medium border border-surface-700"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

