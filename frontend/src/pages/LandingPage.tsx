import { useNavigate } from "react-router-dom";
import { Shield, Brain, Video as VideoIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import b12Video from "../assets/videos/b14.mp4";
import i1 from "../assets/images/g.jpg";
import i2 from "../assets/images/j.jpg";
import i3 from "../assets/images/t.jpg";
import i5 from "../assets/images/r.jpg";
import i6 from "../assets/images/a2.jpg";
import i7 from "../assets/images/a3.png";
import dashboard from "../assets/images/dashboard.png";

// API URL
const API_URL = "http://localhost:5000/api";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans">
      {/* Navbar */}
      <div className="backdrop-blur-md bg-black/60 border-b-4 border-purple-500 sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Background Video Section */}
      <section className="relative w-full h-[80vh] sm:h-[90vh] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover"
        >
          <source src={b12Video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8">
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-[Orbitron] 
                         bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 
                         bg-clip-text text-transparent animate-shine tracking-wide 
                         drop-shadow-[0_0_15px_rgba(147,51,234,0.8)] mb-6 sm:mb-8"
          >
            Forensia
          </h1>
          <h3
            className="text-xl md:text-3xl lg:text-4xl font-medium font-[Orbitron] 
             bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 
             bg-clip-text text-transparent animate-shine tracking-wide 
             drop-shadow-[0_0_15px_rgba(147,51,234,0.8)] mb-6 sm:mb-8"
          >
            Uncovering Evidence through Emotions
          </h3>

          <p className="text-base md:text-lg lg:text-xl text-gray-300 opacity-90 max-w-4xl mx-auto text-center mb-10 sm:mb-12">
            Forensia uses AI to analyze emotions and behavior from video
            footage—helping investigators detect deception, spot hidden
            patterns, and gain deeper insight during criminal investigations.
          </p>
          <button
            onClick={() => navigate("/interrogation")}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 
                       rounded-xl text-lg font-medium hover:opacity-90 transition-all duration-300 overflow-hidden
                       hover:shadow-[0_0_20px_rgba(99,102,241,0.7)]"
          >
            <span className="relative z-10">Analyze Now!</span>
            <div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 
                            opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
            ></div>
          </button>
        </div>
      </section>

      {/* Investigative Insights Section */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Investigative Insights
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[i1, i2, i3, i5, i6, i7].map((img, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={img}
                  alt={`Investigation ${index + 1}`}
                  className="object-cover w-full h-72 sm:h-80 transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-lg font-semibold">
                    Case Study {index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              What We Offer
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto"></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 md:gap-10">
            {[
              {
                icon: (
                  <Shield className="text-white w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                ),
                title: "Security",
                desc: "Protect sensitive information using advanced security measures to ensure integrity.",
                gradient: "from-purple-500 via-pink-500 to-red-500",
              },
              {
                icon: (
                  <Brain className="text-white w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                ),
                title: "AI Insights",
                desc: "Leverage AI to generate actionable insights from complex data streams.",
                gradient: "from-cyan-500 via-blue-500 to-purple-500",
              },
              {
                icon: (
                  <VideoIcon className="text-white w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                ),
                title: "Video Analysis",
                desc: "Analyze video data for emotional and behavioral cues to assist investigations.",
                gradient: "from-blue-500 via-green-500 to-yellow-500",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`bg-gradient-to-r ${item.gradient} rounded-xl p-6 sm:p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 
                            flex-1 min-w-[250px] max-w-[350px] mx-auto sm:mx-0`}
              >
                {item.icon}
                <h3 className="text-xl sm:text-2xl text-white font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="relative z-10 py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Our Dashboard
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto"></div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 xl:gap-16">
            <div className="flex-1 text-center lg:text-left lg:pr-8 xl:pr-12 order-2 lg:order-1 mt-8 lg:mt-0">
              <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-8">
                Get a quick snapshot of all recent analyses with our AI-powered
                emotion and behavior insights. The overview highlights key
                trends, flagged behaviors, and emotional patterns across
                sessions, helping you stay informed and make faster, data-driven
                decisions. Click to explore the full report dashboard.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                          transition-all duration-300 text-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              >
                Explore Dashboard
              </button>
            </div>

            <div className="flex-1 w-full order-1 lg:order-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden relative">
                    <img
                      src={dashboard}
                      alt="Dashboard Analysis"
                      className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-end p-6 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-lg md:text-xl font-semibold">
                        Dashboard Analysis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      {/* <footer className="bg-black text-center text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-400 text-sm sm:text-base">
            © {new Date().getFullYear()} Forensia Detect. All rights reserved.
          </p>
        </div>
      </footer> */}
    </div>
  );
};

// Define the Report type with at least an 'id' property
type Report = {
  id: string | number;
  // Add other properties as needed
};

// getReports function
export async function getReports() {
  try {
    const response = await fetch(`${API_URL}/reports`);

    if (!response.ok) {
      console.error(`Error fetching reports: ${response.status}`);
      return [];
    }

    // The list of reports might still be JSON
    const reportsList = await response.json();

    // Filter out any empty reports
    return reportsList.filter((report: Report) => report && report.id);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export default LandingPage;
