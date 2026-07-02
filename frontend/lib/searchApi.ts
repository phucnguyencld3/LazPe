const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5101/api';

export const uploadImageForSearch = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file); // changed from 'file' to 'image' as param is IFormFile image

    const response = await fetch(`${API_BASE_URL}/image-search`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi khi nhận diện hình ảnh');
    }

    return response.json();
};

export const uploadAudioForSearch = async (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch(`${API_BASE_URL}/Search/voice`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi khi nhận diện giọng nói');
    }

    return response.json();
};
