import React from "react";
import { Scale } from "lucide-react";
import { Product } from "@/types";
import { useCompare } from "@/context/CompareContext";

interface CompareButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

export const CompareButton: React.FC<CompareButtonProps> = ({
  product,
  className = "",
  showText = false,
}) => {
  const { addToCompare, removeFromCompare, isInCompare, compareItems } = useCompare();
  const isSelected = isInCompare(product.id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSelected) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <button
      onClick={toggleCompare}
      className={`group relative flex items-center justify-center transition-all ${
        isSelected
          ? "bg-primary text-white"
          : "bg-white text-slate-400 hover:text-primary hover:bg-primary/5"
      } ${className}`}
      aria-label={isSelected ? "Bỏ so sánh" : "Thêm vào so sánh"}
      title={isSelected ? "Bỏ so sánh" : "Thêm vào so sánh"}
    >
      <Scale size={18} className={isSelected ? "fill-primary/20" : ""} />
      {showText && (
        <span className="ml-2 text-sm font-medium">
          {isSelected ? "Đang so sánh" : "So sánh"}
        </span>
      )}
    </button>
  );
};
