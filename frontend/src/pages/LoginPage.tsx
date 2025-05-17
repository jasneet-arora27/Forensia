import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import videoSrc from "../assets/videos/b11.mp4";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with:", email, password);
    // Normally, validate login here
    navigate("/"); // Navigate to home
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop className="w-full h-full object-cover">
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl mt-12 mx-4 border border-purple-500/30">
        <h2 className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
          Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-3 rounded-md bg-black/20 text-white border border-gray-700 focus:outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-3 rounded-md bg-black/20 text-white border border-gray-700 focus:outline-none"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 rounded-lg font-semibold hover:opacity-90"
          >
            Log In
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-cyan-400 hover:underline font-semibold"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
