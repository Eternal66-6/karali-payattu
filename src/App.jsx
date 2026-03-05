import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { GameEngine } from './game/GameEngine';

export default function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      setGameOver(false);
      setWinner(null);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p) => {
      p.disableFriendlyErrors = true;
      let p1Img = null;
      let p2Img = null;
      let bgImg = null;
      let assetsLoaded = false;

      const applyMagentaFilter = (img) => {
        try {
          img.loadPixels();
          console.log(`Filtering image: ${img.width}x${img.height}`);
          let count = 0;
          for (let i = 0; i < img.pixels.length; i += 4) {
            const r = img.pixels[i];
            const g = img.pixels[i + 1];
            const b = img.pixels[i + 2];
            
            // Aggressive transparency requested: Red > 100, Blue > 100, Green < 150
            if (r > 100 && b > 100 && g < 150) {
              img.pixels[i + 3] = 0;
              count++;
            }
          }
          img.updatePixels();
          console.log(`Magenta filter applied: ${count} pixels made transparent`);
        } catch (e) {
          console.error("Error applying magenta filter:", e);
        }
      };

      p.setup = async () => {
        try {
          p.createCanvas(1280, 720);
          p.noSmooth(); // Prevent color bleeding from interpolation
          console.log('Starting asset loading in setup...');
          
          // Use Promise.all to load images in parallel if loadImage returns a promise in p5 2.0
          // If it doesn't, we can wrap it or just use the callback version with a promise wrapper
          const loadImg = (path, applyFilter = true) => new Promise((resolve) => {
            p.loadImage(path, 
              (img) => {
                console.log(`${path} Loaded Successfully`, img.width, img.height);
                if (applyFilter) applyMagentaFilter(img);
                resolve(img);
              },
              (err) => {
                console.error(`${path} Failed to Load`, err);
                resolve(null);
              }
            );
          });

          p1Img = await loadImg('/player1.png');
          p2Img = await loadImg('/player2.png');
          bgImg = await loadImg('/background.png', false);
          
          gameRef.current = new GameEngine(
            p, 
            p1Img || undefined, 
            p2Img || undefined, 
            bgImg || undefined,
            (win) => {
              setWinner(win);
              setGameOver(true);
            }
          );
          assetsLoaded = true;
          console.log('Assets loaded and GameEngine initialized.');
        } catch (e) {
          console.error("Error in setup:", e);
        }
      };

      p.draw = () => {
        if (!assetsLoaded) {
          p.background(0);
          p.fill(255);
          p.textAlign(p.CENTER);
          p.text("LOADING ASSETS...", p.width / 2, p.height / 2);
          return;
        }
        try {
          if (gameRef.current) {
            gameRef.current.update();
            gameRef.current.draw(p);
          }
        } catch (e) {
          console.error("Global p5 draw error:", e);
          p.noLoop(); // Stop the loop to prevent "Stopping sketch to prevent more errors"
        }
      };
    };

    const p5Instance = new p5(sketch, containerRef.current);

    return () => {
      if (gameRef.current) gameRef.current.destroy();
      p5Instance.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter uppercase italic">Pixel Brawl</h1>
        <p className="text-neutral-400 text-sm font-mono">PROTOTYPE V1.0</p>
      </div>

      <div 
        ref={containerRef} 
        className="border-4 border-neutral-800 rounded-lg shadow-2xl overflow-hidden bg-black relative"
        style={{ width: '1280px', height: '720px' }}
      >
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
            <h2 className="text-6xl font-black text-yellow-500 mb-2 tracking-tighter drop-shadow-lg italic">
              {winner === 'p1' ? 'RED WARRIOR VIJAYAM' : winner === 'p2' ? 'BLUE WARRIOR VIJAYAM' : 'SAMAM'}
            </h2>
            <p className="text-neutral-400 text-xl font-mono tracking-widest mb-8">MATCH COMPLETE</p>
            
            <button 
              onClick={handleRestart}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-none border-2 border-red-400 hover:border-red-300 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] active:scale-95"
            >
              Punararambham
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-12 text-neutral-500 font-mono text-xs uppercase tracking-widest">
        <div className="space-y-2">
          <p className="text-red-500 font-bold">Player 1 (Red)</p>
          <p>Move: WASD</p>
          <p>Punch: F</p>
          <p>Kick: G</p>
          <p>Gamepad: A (Jump), B (Punch), X (Kick)</p>
        </div>
        <div className="space-y-2 text-right">
          <p className="text-blue-500 font-bold">Player 2 (Blue)</p>
          <p>Move: Arrow Keys</p>
          <p>Punch: K</p>
          <p>Kick: L</p>
          <p>Gamepad: A (Jump), B (Punch), X (Kick)</p>
        </div>
      </div>

      <div className="mt-12 text-neutral-700 text-[10px] uppercase tracking-[0.2em]">
        Gamepad API Enabled • p5.js Engine • Modular State Logic
      </div>
    </div>
  );
}
