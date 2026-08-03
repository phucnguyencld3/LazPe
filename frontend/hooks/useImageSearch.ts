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

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File ảnh không được vượt quá 10MB');
            return;
        }

        try {
            setIsImageLoading(true);
            const response = await uploadImageForSearch(file);
            
            if (response.success && response.data) {
                const ai = response.data;
                let queryToSearch = '';
                
                if (ai.type === 'brand' && ai.brand) {
                    queryToSearch = ai.brand;
                } else if (ai.type === 'product') {
                    queryToSearch = [ai.brand, ai.product_name].filter(Boolean).join(' ');
                } else if (ai.type === 'unknown' && ai.keywords && ai.keywords.length > 0) {
                    queryToSearch = ai.keywords.join(' ');
                }

                if (queryToSearch.trim()) {
                    toast.success('Đã nhận diện: ' + queryToSearch.trim());
                    onSearchSuccess(queryToSearch.trim());
                } else {
                    toast.error('Không tìm thấy sản phẩm tương ứng trong ảnh.');
                }
            } else {
                toast.error('Không thể nhận diện hình ảnh.');
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
