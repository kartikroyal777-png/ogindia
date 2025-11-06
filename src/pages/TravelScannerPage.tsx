import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, Info, RefreshCw, FlipHorizontal, AlertTriangle, X, Camera, Utensils, Building2 } from 'lucide-react';
import { runGeminiVisionQuery } from '../lib/gemini';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type ScanMode = 'object' | 'food';

const TravelScannerPage: React.FC = () => {
  const { canUseFeature, showUpgradeModal, incrementFeatureUsage } = useAuth();
  const [scanMode, setScanMode] = useState<ScanMode>('object');
  const [appState, setAppState] = useState<'scanner' | 'analysing' | 'score'>('scanner');
  const [resultData, setResultData] = useState<any | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const analyzeImage = useCallback(async (imageSrc: string | null) => {
    if (!imageSrc) {
      setResultData({ error: "Could not capture or load image." });
      setAppState('score');
      return;
    }

    if (!canUseFeature('food_scanner')) { // Note: using 'food_scanner' usage key for both modes
      showUpgradeModal(true);
      resetScanner();
      return;
    }

    setAppState('analysing');
    setResultData(null);
    
    const base64Image = imageSrc.split(',')[1];
    
    const prompt = scanMode === 'food' 
    ? `Analyze the food in the image. Identify the dish. Your response MUST be a valid JSON object. Provide a health score from 1-10. Estimate nutritional values: calories, fat, sodium, sugar (each with a value and a score out of 10). Give a 1-line health summary and two actionable suggestions. JSON format: { "dish_label": "Name", "score": 8.5, "breakdown": { "calories": { "value": 350, "score": 7 }, "fat": { "value": 15, "score": 6 }, "sodium": { "value": 400, "score": 8 }, "sugar": { "value": 5, "score": 9 } }, "explanation": "Summary.", "suggestions": ["Suggestion 1.", "Suggestion 2."] }`
    : `You are a travel guide assistant. Analyze the object in the image (likely a monument, artifact, or sign in India). Identify it. Your response MUST be a valid JSON object. Provide a name, a short 1-line description, and three interesting bullet points (historical fact, cultural significance, architectural detail). JSON format: { "object_name": "Name", "description": "A short, one-line description.", "facts": ["Fact 1", "Fact 2", "Fact 3"] }`;

    try {
      const aiResponse = await runGeminiVisionQuery(prompt, base64Image);
      const parsedResponse = JSON.parse(aiResponse);
      setResultData(parsedResponse);
      setAppState('score');
      await incrementFeatureUsage('food_scanner');
    } catch (error: any) {
      console.error("Failed to get analysis:", error);
      const errorMessage = error.message || "Could not analyze the image. The AI model might be unavailable or the response was not in the correct format. Please try again.";
      setResultData({ error: errorMessage });
      setAppState('score');
    }
  }, [canUseFeature, showUpgradeModal, incrementFeatureUsage, scanMode]);
  
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      analyzeImage(imageSrc);
    }
  }, [webcamRef, analyzeImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        analyzeImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetScanner = () => {
    setAppState('scanner');
    setResultData(null);
    setCapturedImage(null);
    setCameraError(null);
    setIsCameraReady(false);
  };

  const ScoreRing = ({ score }: { score: number | null }) => {
    if (score === null || isNaN(score)) return null;
    const circumference = 2 * Math.PI * 55;
    const offset = circumference - (score / 10) * circumference;
    const color = score >= 8 ? '#28A745' : score >= 5 ? '#FFC107' : '#E63946';

    return (
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle className="text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="55" cx="60" cy="60" />
          <motion.circle strokeWidth="10" strokeLinecap="round" stroke={color} fill="transparent" r="55" cx="60" cy="60" style={{ strokeDasharray: circumference, strokeDashoffset: circumference, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "circOut" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl font-bold" style={{color}}>{score.toFixed(1)}</span></div>
      </div>
    );
  };

  const renderScanner = () => (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      <div className="absolute top-4 left-4 z-20"><Link to="/" className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><X /></Link></div>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      <div className="flex-grow relative overflow-hidden">
        {cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-black"><AlertTriangle className="w-12 h-12 text-amber-400 mb-4" /><h3 className="text-xl font-semibold">Camera Error</h3><p className="text-gray-400 mt-2">{cameraError}</p><p className="text-xs text-gray-500 mt-4">Grant camera permissions and refresh, or upload an image.</p></div>
        ) : (
          <>
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode, width: 1920, height: 1080 }} className="w-full h-full object-cover" onUserMediaError={() => setCameraError("Could not access the camera. Please ensure permissions are granted.")} onUserMedia={() => setIsCameraReady(true)} />
            {!isCameraReady && <div className="absolute inset-0 bg-black flex flex-col items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-white/20 border-t-orange-500 rounded-full mb-4"></motion.div><p>Starting camera...</p></div>}
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-4 right-4 flex flex-col space-y-4 z-20"><motion.button whileTap={{ scale: 0.9 }} onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white"><FlipHorizontal/></motion.button></div>
        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          <div className="relative w-full max-w-xs aspect-square">
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-xl z-10"></div><div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-xl z-10"></div><div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-orange-500 rounded-bl-xl z-10"></div><div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-orange-500 rounded-br-xl z-10"></div>
            {isCameraReady && !cameraError && <div className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_15px_3px_#FF5722] animate-scan"></div>}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 p-4 flex flex-col items-center z-20 bg-black">
        <div className="flex items-center justify-center space-x-2 bg-gray-800 p-1 rounded-full mb-4">
          <button onClick={() => setScanMode('object')} className={`px-4 py-2 text-sm rounded-full flex items-center space-x-2 ${scanMode === 'object' ? 'bg-orange-500 text-white' : 'text-gray-300'}`}><Building2 className="w-4 h-4" /><span>Object</span></button>
          <button onClick={() => setScanMode('food')} className={`px-4 py-2 text-sm rounded-full flex items-center space-x-2 ${scanMode === 'food' ? 'bg-orange-500 text-white' : 'text-gray-300'}`}><Utensils className="w-4 h-4" /><span>Food</span></button>
        </div>
        <div className="flex justify-around items-center w-full">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center space-y-1 text-gray-300"><Upload className="w-6 h-6" /><span className="text-xs font-medium">Upload</span></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleCapture} className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-800 disabled:opacity-50" disabled={!!cameraError || !isCameraReady}><div className="w-16 h-16 bg-orange-500 rounded-full active:bg-orange-600"></div></motion.button>
          <div className="flex flex-col items-center space-y-1 text-gray-300 opacity-50"><Zap className="w-6 h-6" /><span className="text-xs font-medium">Flash</span></div>
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
      {capturedImage && <img src={capturedImage} alt="Captured item" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />}
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 border-4 border-white/20 border-t-orange-500 rounded-full mb-6" />
      <h3 className="text-xl font-semibold">Analyzing Image...</h3>
      <p className="text-gray-400">Our AI is taking a closer look.</p>
    </div>
  );

  const renderResult = () => {
    if (resultData?.error || !resultData) {
      return (
        <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col items-center justify-center text-center">
          {capturedImage && <img src={capturedImage} alt="Captured item" className="absolute inset-0 w-full h-full object-cover opacity-10 blur-md" />}
          <div className="relative z-10"><div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto"><Info className="w-8 h-8 text-danger" /></div><h2 className="text-2xl font-semibold mb-2">Analysis Failed</h2><p className="text-gray-400 mb-6 max-w-sm">{resultData?.error || "An unexpected error occurred."}</p><motion.button whileTap={{ scale: 0.95 }} onClick={resetScanner} className="w-full max-w-xs flex items-center justify-center space-x-2 py-3 bg-orange-500 font-semibold rounded-xl shadow-lg"><RefreshCw className="w-5 h-5"/><span>Try Again</span></motion.button></div>
        </div>
      );
    }
    
    if (scanMode === 'food') {
      const scoreValue = resultData?.score ? parseFloat(resultData.score) : null;
      return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col">
          {capturedImage && <img src={capturedImage} alt="Captured food" className="absolute top-0 left-0 w-full h-1/2 object-cover opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />}
          <div className="relative p-4 flex-grow overflow-y-auto"><button onClick={resetScanner} className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full z-10"><X/></button><div className="pt-8"><h2 className="text-3xl font-semibold text-center mb-4">{resultData.dish_label}</h2><motion.div initial={{scale:0.5}} animate={{scale:1}} className="flex justify-center my-6"><ScoreRing score={scoreValue} /></motion.div><div className="pb-8"><motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="my-6 bg-white/5 p-4 rounded-2xl"><h3 className="font-semibold mb-3">Health Breakdown</h3><div className="space-y-3 text-sm">{Object.entries(resultData.breakdown).map(([key, value]: [string, any]) => (<div key={key} className="flex justify-between items-center"><span className="capitalize text-gray-400">{key}</span><div className="flex items-center space-x-2"><span className="font-medium">{value.value}</span><div className="w-24 h-2 bg-gray-700 rounded-full"><motion.div initial={{ width: 0 }} animate={{ width: `${(value.score / 10) * 100}%` }} transition={{delay: 0.8}} className={`h-2 rounded-full ${value.score > 7 ? 'bg-success' : value.score > 4 ? 'bg-amber' : 'bg-danger'}`} /></div></div></div>))}</div></motion.div><motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.7}} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl"><div className="flex items-start space-x-3"><Info className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0"/><div><h4 className="font-semibold text-white">AI Health Note</h4><p className="text-sm text-gray-300">{resultData.explanation}</p></div></div></motion.div><motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.9}} className="mt-4"><h4 className="font-semibold text-white mb-2">Healthier Swaps</h4><ul className="space-y-2">{resultData.suggestions.map((tip: string, index: number) => (<li key={index} className="flex items-start space-x-3 text-sm bg-white/5 p-3 rounded-lg"><div className="w-4 h-4 bg-green-500 rounded-full mt-1 flex-shrink-0 border-2 border-gray-900"></div><span className="text-gray-300">{tip}</span></li>))}</ul></motion.div></div></div></div>
        </div>
      );
    }

    if (scanMode === 'object') {
      return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col">
          {capturedImage && <img src={capturedImage} alt="Captured object" className="absolute top-0 left-0 w-full h-1/2 object-cover opacity-30 [mask-image:linear-gradient(to_bottom,white,transparent)]" />}
          <div className="relative p-4 flex-grow overflow-y-auto"><button onClick={resetScanner} className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full z-10"><X/></button><div className="pt-8 text-center"><h2 className="text-3xl font-semibold mb-2">{resultData.object_name}</h2><p className="text-gray-400 italic">{resultData.description}</p><div className="text-left mt-8 space-y-4"><h3 className="font-semibold text-lg">Quick Facts</h3>{resultData.facts.map((fact: string, index: number) => (<motion.div key={index} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.3 + index*0.2}} className="flex items-start space-x-3 bg-white/5 p-4 rounded-lg"><div className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">{index+1}</div><p className="text-gray-300">{fact}</p></motion.div>))}</div></div></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      <AnimatePresence mode="wait">
        {appState === 'scanner' && <motion.div key="scanner" exit={{ opacity: 0 }} className="w-full h-full flex flex-col">{renderScanner()}</motion.div>}
        {appState === 'analysing' && <motion.div key="analysing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">{renderAnalysis()}</motion.div>}
        {appState === 'score' && <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">{renderResult()}</motion.div>}
      </AnimatePresence>
    </div>
  );
};

export default TravelScannerPage;
