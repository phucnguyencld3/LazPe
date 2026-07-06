'use client';

import React from 'react';
import { Mic } from 'lucide-react';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

interface VoiceSearchButtonProps {
    onSearchSuccess: (keyword: string) => void;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({ onSearchSuccess }) => {
    const { isListening, startListening } = useVoiceSearch(onSearchSuccess);

    return (
        <button
            type="button"
            onClick={startListening}
            className={`p-2 transition-colors relative flex items-center justify-center ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-primary'}`}
            title="Tìm kiếm bằng giọng nói"
        >
            <Mic className="w-5 h-5 relative z-10" />
            {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75 z-0 m-2"></span>
            )}
        </button>
    );
};
