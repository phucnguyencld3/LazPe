"use client";

import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn một mục",
  searchPlaceholder = "Tìm kiếm...",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find the selected option to display its label
  const selectedOption = options.find((opt) => opt.value.toString() === value.toString());

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue.toString());
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <div
        onClick={toggleDropdown}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer flex justify-between items-center"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-lg transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                    value.toString() === option.value.toString()
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {value.toString() === option.value.toString() && (
                    <span className="material-symbols-outlined text-[16px] text-primary font-bold">
                      check
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-center text-sm text-slate-400 font-medium">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
