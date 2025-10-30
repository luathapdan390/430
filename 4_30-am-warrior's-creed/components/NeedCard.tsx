import React from 'react';
import {
    CertaintyIcon, VarietyIcon, SignificanceIcon, ConnectionIcon, GrowthIcon, ContributionIcon,
    PlayIcon, LoadingSpinner
} from './icons';

interface NeedCardProps {
    need: string;
    text: string;
    onGenerateAudio: (text: string) => void;
    isGeneratingAudio: boolean;
    isPlaying: boolean;
}

const needIcons: { [key: string]: React.FC<{ className?: string }> } = {
    Certainty: CertaintyIcon,
    Variety: VarietyIcon,
    Significance: SignificanceIcon,
    Connection: ConnectionIcon,
    Growth: GrowthIcon,
    Contribution: ContributionIcon,
};

const needTranslations: { [key: string]: string } = {
    Certainty: "Sự Chắc Chắn",
    Variety: "Sự Đa Dạng",
    Significance: "Sự Quan Trọng",
    Connection: "Sự Kết Nối",
    Growth: "Sự Phát Triển",
    Contribution: "Sự Cống Hiến",
};

export const NeedCard: React.FC<NeedCardProps> = ({ need, text, onGenerateAudio, isGeneratingAudio, isPlaying }) => {
    const Icon = needIcons[need] || CertaintyIcon;
    const translatedNeed = needTranslations[need] || need;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 flex flex-col justify-between shadow-lg transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/50">
            <div>
                <div className="flex items-center mb-4">
                    <Icon className="w-8 h-8 mr-3 text-amber-400" />
                    <h3 className="text-xl font-bold text-white tracking-wide">{translatedNeed}</h3>
                </div>
                <p className="text-slate-300 text-base leading-relaxed">{text}</p>
            </div>
            <div className="mt-6">
                <button
                    onClick={() => onGenerateAudio(text)}
                    disabled={isGeneratingAudio}
                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isGeneratingAudio || isPlaying ? 'bg-slate-600' : 'bg-amber-600 hover:bg-amber-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {isGeneratingAudio ? (
                        <>
                            <LoadingSpinner className="w-5 h-5 mr-2" />
                            Đang tạo âm thanh...
                        </>
                    ) : isPlaying ? (
                         <>
                            <div className="w-5 h-5 mr-2 flex items-center justify-center">
                                <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                           Đang phát...
                        </>
                    ) : (
                        <>
                            <PlayIcon className="w-5 h-5 mr-2" />
                            Nghe lời khẳng định
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};