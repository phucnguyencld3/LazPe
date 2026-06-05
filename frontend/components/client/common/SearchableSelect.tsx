import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

interface Option {
  code: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (code: string, name: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  accentColor?: "primary" | "rose";
}

const removeAccents = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Tìm kiếm...",
  disabled = false,
  accentColor = "rose",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.code) === String(value));

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery) return true;
    const normName = removeAccents(opt.name.toLowerCase());
    const normQuery = removeAccents(searchQuery.toLowerCase());
    return normName.includes(normQuery);
  });

  const handleSelect = (opt: Option) => {
    onChange(opt.code, opt.name);
    setIsOpen(false);
  };

  const ringClass = accentColor === "primary" 
    ? "focus:border-primary focus:ring-primary" 
    : "focus:border-rose-500 focus:ring-rose-500";
    
  const activeBgClass = accentColor === "primary" 
    ? "bg-primary text-white" 
    : "bg-rose-500 text-white";
    
  const hoverTextClass = accentColor === "primary" 
    ? "hover:bg-primary/5 hover:text-primary" 
    : "hover:bg-rose-50 hover:text-rose-500";

  return (
    <div ref={containerRef} className="relative w-full text-slate-800">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none transition-all text-left ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100/50"
        } ${isOpen ? (accentColor === "primary" ? "border-primary ring-1 ring-primary" : "border-rose-500 ring-1 ring-rose-500") : ""}`}
      >
        <span className={selectedOption ? "text-slate-800 font-medium" : "text-slate-400"}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Input */}
          <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-slate-50/50">
            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm border-none outline-none focus:ring-0 p-1 text-slate-800 placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.code) === String(value);
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left ${
                      isSelected ? activeBgClass : `text-slate-700 ${hoverTextClass}`
                    }`}
                  >
                    <span className={isSelected ? "font-bold" : "font-normal"}>{opt.name}</span>
                    {isSelected && <Check className="h-4 w-4 stroke-[2.5]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-center text-xs text-slate-400 font-medium">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
