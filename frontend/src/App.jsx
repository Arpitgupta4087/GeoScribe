import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import one from "./assets/one.jpg";
import Analysis from "./Analysis";

function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      // fake classification result for now
      setResult({ label: "Rocky", confidence: "92%" });
    }
  };

  const handleAnalysis = () => {
    navigate("/analysis"); // go to Analysis page
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${one})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-2 bg-black bg-opacity-50 opacity-70 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">GeoScribe</h1>
        <nav className="flex space-x-6 text-lg">
          <a href="#" className="hover:text-blue-400 transition">About Us</a>
          <a href="#" className="hover:text-blue-400 transition">Contact Us</a>
          <a href="#" className="hover:text-blue-400 transition">Resources</a>
        </nav>
      </header>

      {/* Main Section */}
      <main className="flex-grow flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-95 p-10 rounded-2xl shadow-2xl text-center max-w-md w-full text-white">
          <h2 className="text-2xl font-semibold mb-6">Upload an image for classification</h2>

          {/* Upload Button */}
          <label className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 hover:scale-105 transition transform duration-200">
            Choose Image
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>

          {/* Show result */}
          {result && (
            <div className="mt-6">
              {image && (
                <img
                  src={image}
                  alt="Uploaded"
                  className="mx-auto mb-4 max-h-40 rounded-lg shadow-md border border-gray-600"
                />
              )}
              <p className="font-medium text-lg">
                Result: <span className="text-blue-400">{result.label}</span>
              </p>
              <p className="text-gray-300">
                Confidence: {result.confidence}
              </p>

              <button
                onClick={handleAnalysis}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:scale-105 transition transform duration-200"
              >
                View Detailed Analysis
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 text-white text-center p-2 opacity-70 text-sm tracking-wide">
        © All rights reserved 2025
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </Router>
  );
}

export default App;
