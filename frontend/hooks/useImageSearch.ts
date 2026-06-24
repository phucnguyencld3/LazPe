import { useState } from 'react';
import { uploadImageForSearch } from '@/lib/searchApi';
import { toast } from 'sonner';

export const useImageSearch = (onSearchSuccess: (keyword: string) => void) => {
    const [isImageLoading, setIsImageLoading] = useState(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be uploaded again if needed
        event.target.value = '';

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn một file hình ảnh hợp lệ.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Kích thước ảnh quá lớn, vui lòng chọn ảnh dưới 5MB.');
            return;
        }

        try {
            setIsImageLoading(true);
            const data = await uploadImageForSearch(file);
            if (data.success && data.query) {
                toast.success('Đã nhận diện: ' + data.query);
                onSearchSuccess(data.query);
            } else {
                toast.error('Không tìm thấy sản phẩm trong ảnh.');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Có lỗi xảy ra khi xử lý ảnh.');
        } finally {
            setIsImageLoading(false);
        }
    };

    return {
        isImageLoading,
        handleImageUpload,
    };
};
