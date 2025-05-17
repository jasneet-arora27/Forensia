import React, { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Background from "../components/Background";
import {
  analyzeFrame,
  startSession,
  endSession,
  saveFrame,
  EmotionData,
} from "../services/forensiaApi";

const InterrogationPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotion, setEmotion] = useState<EmotionData | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [framesSaved, setFramesSaved] = useState(0);
  const [analysisLoop, setAnalysisLoop] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [errorMessage] = useState<string | null>(null);

  // Check server connection on component mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      // Simple fetch to check if server is reachable
      const response = await fetch("http://localhost:5000/api/sessions", {
        method: "GET",
        // Add headers to handle CORS preflight requests
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        console.log("Server connection successful");
        setServerStatus("online");
      } else {
        console.error("Server returned error:", response.status);
        setServerStatus("offline");
      }
    } catch (error) {
      console.error("Failed to connect to server:", error);
      setServerStatus("offline");
    }
  };

  // Start a new session
  const startAnalysis = async () => {
    if (serverStatus !== "online") {
      // Recheck connection before giving up
      await checkServerConnection();

      // After rechecking, get the latest status directly from the server
      const response = await fetch("http://localhost:5000/api/sessions", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const latestStatus = response.ok ? "online" : "offline";
      if (latestStatus !== "online") {
        alert(
          "Cannot connect to the server. Please ensure the backend is running."
        );
        return;
      }
    }

    try {
      const result = await startSession();
      if (result.success) {
        setSessionId(result.session_id);
        setAnalyzing(true);
        startVideoCapture();
      } else {
        alert("Failed to start session: " + result.error);
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Error connecting to the server");
    }
  };

  // End the current session
  const endAnalysis = async () => {
    if (sessionId) {
      try {
        const result = await endSession(sessionId);
        if (result.success) {
          setAnalyzing(false);
          setSessionId(null);
          setEmotion(null);
          setFramesSaved(0);
          stopVideoCapture();

          if (result.report) {
            alert(`Session ended and report generated: ${result.report}`);
          }
        }
      } catch (error) {
        console.error("Error ending session:", error);
        alert("Error connecting to the server");
      }
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (analyzing && sessionId) {
        endAnalysis();
      }
      if (analysisLoop) {
        cancelAnimationFrame(analysisLoop);
      }
    };
  }, [analyzing, sessionId, analysisLoop]);

  // Start video capture
  const startVideoCapture = async () => {
    try {
      console.log("Starting video capture");

      // Request higher quality video for better face detection
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 }, // Higher resolution for better face detection
          height: { ideal: 720 },
          facingMode: "user", // Use front camera on mobile
        },
      });

      if (!videoRef.current) {
        throw new Error("Video element not available");
      }

      console.log("Camera stream obtained");
      videoRef.current.srcObject = stream;

      // Make sure video is ready before starting analysis
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          return reject("Video element not available");
        }

        // Set a timeout in case video never loads
        const timeoutId = setTimeout(() => {
          reject("Video initialization timed out");
        }, 10000);

        // Handle metadata loaded
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) {
            clearTimeout(timeoutId);
            return reject("Video element not available after metadata loaded");
          }

          videoRef.current
            .play()
            .then(() => {
              clearTimeout(timeoutId);
              console.log(
                "Video started with dimensions:",
                videoRef.current?.videoWidth,
                videoRef.current?.videoHeight
              );
              // Wait a moment to ensure video is really playing
              setTimeout(resolve, 500);
            })
            .catch((err) => {
              clearTimeout(timeoutId);
              console.error("Failed to play video:", err);
              reject(err);
            });
        };
      });

      console.log("Video playing, starting analysis loop");
      // Start the analysis loop
      analyzeVideoFrame(); // Start the loop directly instead of using requestAnimationFrame
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        `Failed to access camera: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      setAnalyzing(false); // Ensure analyzing state is reset
    }
  };

  // Stop video capture
  const stopVideoCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }

    if (analysisLoop) {
      cancelAnimationFrame(analysisLoop);
      setAnalysisLoop(null);
    }
  };

  // Analyze the current video frame
  const analyzeVideoFrame = () => {
    console.log("Starting analysis frame cycle");

    if (!analyzing || !sessionId || !videoRef.current || !canvasRef.current) {
      console.log("Analysis stopped - missing dependencies");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Failed to get canvas context");
      return;
    }

    // Check if video has actual dimensions and is playing
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
      console.log("Video not fully initialized yet, waiting...");
      const loop = requestAnimationFrame(analyzeVideoFrame);
      setAnalysisLoop(loop);
      return;
    }

    try {
      // Set canvas dimensions to match video but reduce size for better transmission
      // DeepFace works better with smaller, focused images
      const targetWidth = 640; // Standard webcam resolution, good balance for face detection

      // Calculate aspect ratio to maintain proportions
      const aspectRatio = video.videoWidth / video.videoHeight;

      // Set canvas size to our target dimensions
      canvas.width = targetWidth;
      canvas.height = targetWidth / aspectRatio;

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // CRITICAL: Draw the video frame without filters first
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the frame data as base64 with moderate quality (0.8 is a good balance)
      // Higher quality (1.0) creates too large files, lower quality loses facial details
      const frameData = canvas.toDataURL("image/jpeg", 0.8);

      console.log(
        "Frame captured, size:",
        Math.round(frameData.length / 1024),
        "KB"
      );

      // Send frame for analysis
      const doAnalysis = async () => {
        if (!analyzing || !sessionId) return;

        try {
          console.log(`Sending frame for analysis, session: ${sessionId}`);
          const result = await analyzeFrame(sessionId, frameData);

          if (!analyzing) return;

          if (result.success) {
            console.log("Analysis result received:", {
              faceDetected: result.face_detected,
              emotion: result.emotion?.dominant || "none",
            });
            setEmotion(result.emotion);
            setFaceDetected(result.face_detected);
          } else {
            console.warn("Analysis returned error:", result.error);
          }
        } catch (error) {
          console.error("Error during frame analysis:", error);
        }
      };

      // Start analysis
      doAnalysis();

      // Schedule next frame with a 1500ms delay (matching backend's processing capabilities)
      setTimeout(() => {
        if (analyzing) {
          console.log("Scheduling next analysis frame");
          const loop = requestAnimationFrame(analyzeVideoFrame);
          setAnalysisLoop(loop);
        }
      }, 1500);
    } catch (error) {
      console.error("Critical error in frame capture:", error);

      setTimeout(() => {
        if (analyzing) {
          const loop = requestAnimationFrame(analyzeVideoFrame);
          setAnalysisLoop(loop);
        }
      }, 2000);
    }
  };

  // Save the current frame
  const saveCurrentFrame = async () => {
    if (!analyzing || !sessionId) return;

    try {
      // Create default empty emotion data if none exists
      const emptyEmotion = { dominant: null, scores: {} };

      const result = await saveFrame(sessionId, {
        emotion: emotion || emptyEmotion, // Use emotion if available, otherwise use empty data
        gestures: [],
        timestamp: Date.now() / 1000, // Current time in seconds
        face_detected: faceDetected,
        time_str: new Date().toISOString(),
      });

      if (result.success) {
        setFramesSaved((prev) => prev + 1);
        console.log("Frame saved successfully");
      } else {
        console.error("Error saving frame:", result.error);
      }
    } catch (error) {
      console.error("Error saving frame:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Background />

      <main className="flex-grow container mx-auto p-4 z-10 relative">
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Forensic Analysis
          </h1>

          {/* Server Status Alert */}
          {serverStatus === "checking" && (
            <div className="mb-4 p-3 bg-yellow-600 text-white rounded text-center">
              Connecting to server...
            </div>
          )}

          {serverStatus === "offline" && (
            <div className="mb-4 p-3 bg-red-600 text-white rounded text-center">
              Server connection error. Please ensure the backend is running.
              <button
                onClick={checkServerConnection}
                className="ml-4 px-2 py-1 bg-white text-red-600 rounded hover:bg-gray-100"
              >
                Retry
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-orange-600 text-white rounded text-center">
              {errorMessage}
            </div>
          )}

          {/* Video Display */}
          <div className="mb-6">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-auto border-2 border-gray-700 rounded bg-gray-900"
                style={{
                  minHeight: "300px",
                  transform: "scaleX(-1)", // Mirror the video so it works like a mirror
                }}
                autoPlay
                muted
                playsInline
              />

              {/* Hidden canvas for processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay status indicator */}
              {analyzing && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-sm rounded">
                  Analyzing...
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={analyzing ? endAnalysis : startAnalysis}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                analyzing
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={serverStatus !== "online" && !analyzing}
            >
              {analyzing ? "Stop Analysis" : "Start Analysis"}
            </button>

            <button
              onClick={saveCurrentFrame}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!analyzing}
            >
              Save Frame
            </button>
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emotion Analysis */}
            <div className="bg-slate-700 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Emotion Analysis</h2>

              {emotion && emotion.dominant ? (
                <>
                  <div className="mb-2 text-lg">
                    <span className="font-medium">Dominant:</span>{" "}
                    {emotion.dominant}
                  </div>

                  <div className="space-y-2">
                    {Object.entries(emotion.scores || {}).map(
                      ([key, value]) => (
                        <div key={key} className="flex items-center">
                          <span className="w-24">{key}:</span>
                          <div className="flex-grow bg-slate-800 h-4 rounded overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 w-12 text-right">
                            {value.toFixed(1)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">
                  {analyzing
                    ? "No emotions detected yet"
                    : "Start analysis to detect emotions"}
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="bg-slate-700 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Session Info</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Session ID:</span>
                  <span className="font-mono">{sessionId || "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={analyzing ? "text-green-400" : "text-gray-400"}
                  >
                    {analyzing ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Face Detected:</span>
                  <span
                    className={faceDetected ? "text-green-400" : "text-red-400"}
                  >
                    {faceDetected ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Frames Saved:</span>
                  <span>{framesSaved}</span>
                </div>

                <div className="flex justify-between">
                  <span>Server Status:</span>
                  <span
                    className={
                      serverStatus === "online"
                        ? "text-green-400"
                        : serverStatus === "checking"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {serverStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Face Detection Guidance */}
          {!faceDetected && analyzing && (
            <div className="mt-4">
              <div className="p-3 bg-yellow-600 rounded text-white">
                <h3 className="font-bold mb-1">No face detected</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Position your face in the center of the frame</li>
                  <li>Make sure your face is well-lit from the front</li>
                  <li>
                    Avoid backlighting (don't sit with a window behind you)
                  </li>
                  <li>Try moving closer to the camera</li>
                  <li>Ensure nothing is covering your face</li>
                </ul>
              </div>

              {/* Visual face position guide */}
              <div
                className="relative mt-4 mx-auto"
                style={{ width: "200px", height: "200px" }}
              >
                <div className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full"></div>
                <div className="absolute inset-[25%] border-2 border-yellow-200 rounded-full"></div>
                <div className="text-center text-yellow-400 mt-[85px]">
                  Position face here
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InterrogationPage;
