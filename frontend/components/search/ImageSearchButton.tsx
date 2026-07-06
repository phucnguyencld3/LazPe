'use client';

import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useImageSearch } from '@/hooks/useImageSearch';

interface ImageSearchButtonProps {
    onSearchSuccess: (keyword: string) => void;
}

export const ImageSearchButton: React.FC<ImageSearchButtonProps> = ({ onSearchSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isImageLoading, handleImageUpload } = useImageSearch(onSearchSuccess);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="relative flex items-center justify-center">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
            />
            <button
                type="button"
                onClick={handleCameraClick}
                disabled={isImageLoading}
                className="p-2 text-gray-400 hover:text-primary transition-colors disabled:opacity-50 flex items-center justify-center"
                title="Tìm kiếm bằng hình ảnh"
            >
                {isImageLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                    <Camera className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};
