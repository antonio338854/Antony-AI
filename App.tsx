
import React, { useState, useEffect, Suspense } from 'react';
import { generateWorldName } from './services/geminiService';

const Game = React.lazy(() => import('./components/Game'));

const Loader: React.FC = () => (
  <div className="w-full h-full flex justify-center items-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
    <p className="ml-4 text-sky-400 text-xl">Entering the VoxelVerse...</p>
  </div>
);

const App: React.FC = () => {
  const [worldName, setWorldName] = useState<string>('The Blocky Expanse');
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const name = await generateWorldName();
        setWorldName(name);
      } catch (error) {
        console.error("Failed to generate world name, using default.", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchName();
  }, []);

  if (isGameStarted) {
    return (
      <Suspense fallback={<Loader />}>
        <Game />
      </Suspense>
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col justify-center items-center font-mono">
      <div 
        className="absolute inset-0 bg-grid-sky-400/[0.05]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #1e3a8a 1px, transparent 1px),
            linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      ></div>
      <div className="relative z-10 text-center p-8 bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl shadow-sky-500/20 backdrop-blur-sm border border-sky-500/20">
        <h1 className="text-5xl md:text-7xl font-bold text-sky-400 mb-2">VoxelVerse Shooter</h1>
        <p className="text-xl text-gray-300 mb-8">
          Now entering: <span className="text-amber-400 font-semibold">{isLoading ? 'Generating name...' : worldName}</span>
        </p>
        {isLoading ? (
          <div className="flex justify-center items-center h-12">
            <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-amber-400"></div>
          </div>
        ) : (
          <button
            onClick={() => setIsGameStarted(true)}
            className="px-8 py-3 bg-sky-500 text-white font-bold text-lg rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/50"
          >
            Start Exploring
          </button>
        )}
        <div className="mt-8 text-left text-sm text-gray-400 max-w-md mx-auto p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h2 className="font-bold text-gray-200 mb-2">Controls:</h2>
          <p><strong className="text-sky-400">Desktop:</strong> WASD to move, Mouse to look, Click to shoot.</p>
          <p><strong className="text-sky-400">Mobile:</strong> Use the on-screen joystick to move and the fire button to shoot.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
