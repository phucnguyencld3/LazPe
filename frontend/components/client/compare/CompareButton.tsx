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
      className={`group flex items-center h-10 px-2.5 rounded-[8px] border transition-all duration-300 ease-out shrink-0 active:scale-90 ${
        isSelected
          ? "bg-primary border-primary text-white"
          : "bg-white border-slate-200 text-slate-400 hover:text-primary hover:bg-primary/5 hover:border-primary/30 shadow-sm"
      } ${className}`}
    >
      <Scale size={20} className={`shrink-0 transition-all ${isSelected ? "fill-primary/20" : ""}`} />
      <div className="grid grid-cols-[0fr] group-hover:grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-out">
        <div className="overflow-hidden">
          <span className="whitespace-nowrap text-sm font-semibold pl-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            {isSelected ? "Bỏ so sánh" : "So sánh"}
          </span>
        </div>
      </div>
    </button>
  );
};
