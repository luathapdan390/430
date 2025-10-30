import React, { useState, useRef, useCallback, useMemo } from 'react';
import { TransformedBelief } from './types';
import { transformBelief, generateSpeech } from './services/geminiService';
import { playAudio } from './utils/audioUtils';
import { NeedCard } from './components/NeedCard';
import { LoadingSpinner } from './components/icons';

const App: React.FC = () => {
    const [limitingBelief, setLimitingBelief] = useState('Tôi mới 51 tuổi, còn nhiều thời gian để sống nên tôi có thể ngủ nướng tiếp.');
    const [yearsToCalculate, setYearsToCalculate] = useState(30);
    const [hourlyRate, setHourlyRate] = useState(25);
    const [transformedBeliefs, setTransformedBeliefs] = useState<TransformedBelief[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [audioStates, setAudioStates] = useState<{ [key: string]: { isGenerating: boolean; isPlaying: boolean; } }>({});

    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const financialValue = useMemo(() => {
        if (yearsToCalculate <= 0 || hourlyRate <= 0) return { usd: 0, vnd: 0 };
        const totalHoursGained = 3 * 365 * yearsToCalculate;
        const usd = totalHoursGained * hourlyRate;
        const vnd = usd * 25400; // Approximate rate for client-side display
        return { usd, vnd };
    }, [yearsToCalculate, hourlyRate]);

    const handleTransform = async () => {
        if (!limitingBelief.trim() || yearsToCalculate <= 0 || hourlyRate <= 0) {
            setError("Vui lòng nhập đầy đủ và hợp lệ các thông tin.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setTransformedBeliefs([]);

        // Calculation: 3 hours/day * years / (24 hours/day / 365 days/year) -> not right
        // 3 hours/day is 1/8 of a day. So years gained = years * 1/8
        const extraYearsGained = (3 * 365 * yearsToCalculate) / (24 * 365);


        try {
            const beliefs = await transformBelief(limitingBelief, yearsToCalculate, extraYearsGained, hourlyRate);
            setTransformedBeliefs(beliefs);
            
            const initialAudioStates: { [key: string]: { isGenerating: boolean; isPlaying: boolean; } } = {};
            beliefs.forEach(b => {
                initialAudioStates[b.need] = { isGenerating: false, isPlaying: false };
            });
            setAudioStates(initialAudioStates);

        } catch (e) {
            setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const stopCurrentAudio = useCallback(() => {
        if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current.disconnect();
            currentAudioSourceRef.current = null;
        }
        setAudioStates(prev => {
            const newStates = { ...prev };
            Object.keys(newStates).forEach(key => {
                newStates[key].isPlaying = false;
            });
            return newStates;
        });
    }, []);

    const handleGenerateAudio = async (need: string, text: string) => {
        stopCurrentAudio();
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        setAudioStates(prev => ({ ...prev, [need]: { ...prev[need], isGenerating: true } }));
        setError(null);

        try {
            const base64Audio = await generateSpeech(text);
            
            const onEnded = () => {
                setAudioStates(prev => ({ ...prev, [need]: { ...prev[need], isPlaying: false } }));
                currentAudioSourceRef.current = null;
            };

            const source = await playAudio(base64Audio, audioContextRef.current, onEnded);
            currentAudioSourceRef.current = source;
            setAudioStates(prev => ({ ...prev, [need]: { isGenerating: false, isPlaying: true } }));

        } catch (e) {
            setError(e instanceof Error ? e.message : "Lỗi tạo âm thanh.");
            setAudioStates(prev => ({ ...prev, [need]: { ...prev[need], isGenerating: false } }));
        }
    };


    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 selection:bg-amber-500 selection:text-white">
            <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?blur=10&grayscale')] bg-cover bg-center opacity-10"></div>
            <div className="relative max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-red-600 pb-2">
                        Chiến Binh 4:30 Sáng
                    </h1>
                    <p className="text-lg text-slate-400 mt-2">
                        Biến đổi niềm tin giới hạn thành sức mạnh vô song.
                    </p>
                </header>

                <main>
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-3xl mx-auto">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="limiting-belief" className="block text-sm font-medium text-slate-300 mb-2">
                                    1. Nhập niềm tin giới hạn đang cản trở bạn:
                                </label>
                                <textarea
                                    id="limiting-belief"
                                    rows={3}
                                    value={limitingBelief}
                                    onChange={(e) => setLimitingBelief(e.target.value)}
                                    className="block w-full bg-slate-900/50 border-slate-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white placeholder-slate-500"
                                    placeholder="Ví dụ: Tôi đã già, không cần phải cố gắng nữa..."
                                />
                            </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="years" className="block text-sm font-medium text-slate-300 mb-2">
                                        2. Số năm bạn sẽ dậy sớm?
                                    </label>
                                    <input
                                        type="number"
                                        id="years"
                                        value={yearsToCalculate}
                                        onChange={(e) => setYearsToCalculate(parseInt(e.target.value, 10) || 0)}
                                        className="block w-full bg-slate-900/50 border-slate-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hourly-rate" className="block text-sm font-medium text-slate-300 mb-2">
                                        3. Thu nhập của bạn ($/giờ)?
                                    </label>
                                    <input
                                        type="number"
                                        id="hourly-rate"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(parseInt(e.target.value, 10) || 0)}
                                        className="block w-full bg-slate-900/50 border-slate-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white"
                                    />
                                </div>
                           </div>
                             <div>
                                <p className="text-xs text-slate-400 mt-2 text-center bg-slate-900/50 p-3 rounded-md border border-slate-700">
                                    Dậy sớm 3 giờ/ngày trong <span className="font-bold text-amber-400">{yearsToCalculate}</span> năm, bạn có thêm <span className="font-bold text-amber-400">{((3 * 365 * yearsToCalculate) / (24*365)).toFixed(2)}</span> năm để sống,
                                    tương đương <span className="font-bold text-green-400">${financialValue.usd.toLocaleString('en-US')}</span>
                                    {' '} (~<span className="font-bold text-green-400">{financialValue.vnd.toLocaleString('vi-VN')} VNĐ</span>).
                                </p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={handleTransform}
                                disabled={isLoading}
                                className="w-full text-lg font-semibold rounded-lg px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-lg"
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner className="w-6 h-6 mr-3" />
                                        ĐANG TÔI LUYỆN Ý CHÍ...
                                    </>
                                ) : (
                                    '⚡ RÈN GIŨA NIỀM TIN'
                                )}
                            </button>
                        </div>
                         {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    </div>

                    {transformedBeliefs.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-center mb-8 text-slate-200">Niềm Tin Chiến Binh Của Bạn</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {transformedBeliefs.map((belief) => (
                                    <NeedCard
                                        key={belief.need}
                                        need={belief.need}
                                        text={belief.text}
                                        onGenerateAudio={(text) => handleGenerateAudio(belief.need, text)}
                                        isGeneratingAudio={audioStates[belief.need]?.isGenerating || false}
                                        isPlaying={audioStates[belief.need]?.isPlaying || false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;