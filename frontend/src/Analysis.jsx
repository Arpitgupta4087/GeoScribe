import two from "./assets/two.jpg";

function Analysis() {
  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{
        backgroundImage: `url(${two})`,
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

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-gray-800 bg-opacity-95 rounded-2xl shadow-2xl p-10 max-w-4xl w-full text-center">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Detailed Analysis</h1>
          <p className="text-lg text-gray-300 mb-8">
            Explore in-depth insights, geological observations, and terrain classification details.
          </p>

          {/* Analysis Cards - stacked vertically */}
          <div className="flex flex-col gap-6">
            {/* Classification */}
            <div className="bg-gray-700 rounded-xl p-6 shadow hover:scale-105 transition transform duration-200">
              <h2 className="text-xl font-semibold mb-2 text-indigo-400">Classification</h2>
              <p className="text-gray-200">
                Predicted Label: <span className="font-bold">Rocky</span>
              </p>
              <p className="text-gray-400">Confidence: 92%</p>
            </div>

            {/* Insights - Expanded */}
            <div className="bg-gray-700 rounded-xl p-6 shadow hover:scale-105 transition transform duration-200 text-left">
              <h2 className="text-xl font-semibold mb-2 text-indigo-400">Insights</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  The surface texture indicates <span className="font-bold">rocky terrain</span>, characterized by
                  irregular fragments and coarse structure.
                </li>
                <li>
                  Such terrain is typically associated with <span className="font-bold">erosion-resistant
                  rock formations</span>, often found in mountainous or plateau regions.
                </li>
                <li>
                  Presence of <span className="font-bold">minimal vegetation</span> suggests arid or semi-arid
                  climatic conditions with limited soil development.
                </li>
                <li>
                  Rock stability levels are suitable for <span className="font-bold">geological surveys</span> and
                  <span className="font-bold"> construction studies</span>, but may pose challenges for agriculture.
                </li>
                <li>
                  The observed coloration hints at <span className="font-bold">mineral composition</span> possibly
                  dominated by limestone or granite deposits.
                </li>
                <li>
                  Potential applications: site analysis for <span className="font-bold">mining projects</span>,
                  <span className="font-bold"> infrastructure planning</span>, and
                  <span className="font-bold"> environmental impact assessments</span>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 text-white text-center p-2 opacity-70 text-sm tracking-wide">
        © All rights reserved 2025
      </footer>
    </div>
  );
}

export default Analysis;
