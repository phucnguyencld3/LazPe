import { useState, useEffect, useRef } from 'react';
import { uploadAudioForSearch } from '@/lib/searchApi';
import { toast } from 'sonner';

export const useVoiceSearch = (onSearchSuccess: (keyword: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Initialize Web Speech API if supported
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'vi-VN';

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    toast.success('Đã nhận diện: ' + transcript);
                    onSearchSuccess(transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error !== 'no-speech') {
                        // Fallback to backend audio processing if web speech fails
                        fallbackToAudioRecording();
                    } else {
                        setIsListening(false);
                        toast.error('Không nghe thấy âm thanh, vui lòng thử lại.');
                    }
                };

                recognition.onend = () => {
                    if (isListening && !mediaRecorderRef.current) {
                        setIsListening(false);
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, [onSearchSuccess, isListening]);

    const fallbackToAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Clean up stream
                stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current = null;
                
                try {
                    toast.info('Đang phân tích giọng nói bằng AI...');
                    const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
                    const data = await uploadAudioForSearch(file);
                    
                    if (data.success && data.query) {
                        toast.success('Đã nhận diện: ' + data.query);
                        onSearchSuccess(data.query);
                    } else {
                        toast.error('Không nhận diện được giọng nói.');
                    }
                } catch (error: any) {
                    console.error(error);
                    toast.error(error.message || 'Lỗi xử lý giọng nói');
                } finally {
                    setIsListening(false);
                }
            };

            // Stop recording after 4 seconds to process
            mediaRecorder.start();
            setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, 4000);

        } catch (error) {
            console.error('Error accessing microphone', error);
            setIsListening(false);
            toast.error('Vui lòng cấp quyền sử dụng microphone để tìm kiếm bằng giọng nói.');
        }
    };

    const startListening = () => {
        if (isListening) {
            // Stop logic
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        setIsListening(true);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error(error);
                fallbackToAudioRecording();
            }
        } else {
            fallbackToAudioRecording();
        }
    };

    return {
        isListening,
        startListening,
    };
};
