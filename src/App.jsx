import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebaseConfig";
import rocks from "./assets/rocks.png";

function Home() {
    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imageBase64, setImageBase64] = useState(null); // New state for base64
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [gpsLocation, setGpsLocation] = useState(null); // GPS state
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Capture GPS location on mount
    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    console.log(`📍 GPS acquired: ${position.coords.latitude}, ${position.coords.longitude}`);
                },
                (err) => {
                    console.warn('GPS not available:', err.message);
                }
            );
        }
    }, []);

    // Helper function to compress image and convert to base64
    const compressImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Resize to max 500x500 to save Firestore space
                    const MAX_SIZE = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to 80% JPEG
                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(base64);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFile = async (file) => {
        if (file && file.type.startsWith('image/')) {
            const imgURL = URL.createObjectURL(file);
            setImage(imgURL);
            setImageFile(file);
            setResult(null);
            setError(null);

            try {
                // Generate base64 string immediately for passing later
                const base64 = await compressImageToBase64(file);
                setImageBase64(base64);
            } catch (err) {
                console.error("Failed to compress image:", err);
            }
        } else {
            setError("Please select a valid image file.");
        }
    };

    const handleUpload = (e) => {
        handleFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleClassify = async () => {
        if (!imageFile) {
            setError("Please choose an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", imageFile);

        try {
            // Use environment variable for API URL (defaults to localhost for dev)
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
            let url = `${apiBase}/predict/`;
            if (gpsLocation) {
                url += `?latitude=${gpsLocation.latitude}&longitude=${gpsLocation.longitude}`;
            }

            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Note: data.analysis_data now contains the structured Gemini output
            setResult({
                label: data.predicted_class,
                confidence: `${(data.confidence * 100).toFixed(1)}%`,
                analysisData: data.analysis_data, // NEW: Pass the structured data
                imageBase64: imageBase64 // NEW: Pass the compressed image string
            });

        } catch (err) {
            console.error("Error during classification:", err);
            setError(`Classification failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalysis = () => {
        navigate("/analysis", { state: result });
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative bg-surface-950 overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 mix-blend-luminosity"
                style={{ backgroundImage: `url(${rocks})` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface-950/70 via-surface-950/90 to-surface-950" />

            {/* Animated Accent */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[150px] z-0 animate-pulse-glow" />

            {/* Navbar */}
            <header className="relative z-20 flex justify-between items-center px-8 py-4 bg-surface-900/40 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <svg className="w-5 h-5 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-wide">GeoScribe</h1>
                </div>

                <nav className="flex items-center space-x-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 text-sm font-medium text-surface-200 hover:text-white hover:bg-surface-800/50 rounded-lg transition-all"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-surface-200 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                        Logout
                    </button>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="text-center mb-10 max-w-2xl px-4">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
                        Understanding <span className="text-gradient">Ground Terrain</span>
                    </h2>
                    <p className="text-lg text-surface-300">
                        Upload a ground-level image to instantly classify terrain and receive agricultural and environmental insights.
                    </p>
                </div>

                <div className="w-full max-w-xl">
                    <div className="glass-panel p-8 rounded-2xl shadow-2xl border-white/10">

                        {/* Upload Zone */}
                        {!image && (
                            <div
                                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ${isDragging
                                    ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
                                    : 'border-surface-600 hover:border-brand-400/50 hover:bg-surface-800/50'
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-surface-800 flex items-center justify-center border border-surface-700">
                                    <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">Drag & drop your image here</h3>
                                <p className="text-sm text-surface-400 mb-6">Supports JPG, PNG (Max 10MB)</p>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-2.5 bg-surface-800 hover:bg-surface-700 text-white font-medium rounded-lg border border-surface-600 hover:border-surface-500 transition-all shadow-sm"
                                >
                                    Browse Files
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Image Preview & Classification */}
                        {image && !result && (
                            <div className="animate-slide-up">
                                <div className="relative rounded-xl overflow-hidden mb-6 border border-surface-700 shadow-lg group">
                                    <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => { setImage(null); setImageFile(null); setImageBase64(null); }}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-transform hover:scale-110"
                                            title="Remove image"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                                        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleClassify}
                                    disabled={isLoading}
                                    className={`w-full py-3.5 px-4 rounded-xl text-brand-950 font-bold text-lg bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-300 shadow-[0_0_20px_rgba(9,220,90,0.2)] flex items-center justify-center gap-2 ${isLoading
                                        ? 'opacity-80 cursor-wait'
                                        : 'hover:from-brand-300 hover:to-brand-400 hover:shadow-[0_0_30px_rgba(9,220,90,0.4)] transform hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-brand-950/30 border-t-brand-950 rounded-full animate-spin" />
                                            <span>Analyzing Terrain...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            <span>Classify Image</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Results Presentation */}
                        {result && !isLoading && (
                            <div className="animate-slide-up space-y-6">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                                    <img src={image} alt="Thumbnail" className="w-16 h-16 rounded-lg object-cover border border-surface-600" />
                                    <div>
                                        <p className="text-sm text-surface-400 mb-1">Classification Result</p>
                                        <p className="text-xl font-bold text-white flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                                            {result.label}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-sm text-surface-400 mb-1">Confidence</p>
                                        <p className="text-lg font-mono font-semibold text-brand-400">{result.confidence}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setImage(null); setImageFile(null); setResult(null); setImageBase64(null); }}
                                        className="py-3 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-medium border border-surface-600 transition-all"
                                    >
                                        Analyze Another
                                    </button>
                                    <button
                                        onClick={handleAnalysis}
                                        className="py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-brand-400 to-brand-500 text-brand-950 hover:from-brand-300 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/20"
                                    >
                                        View Insights ✨
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;