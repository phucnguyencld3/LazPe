import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode;
  className?: string;
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

// Props for TableRow
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

// Props for TableCell
interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
}

// Table Component
export const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <table className={`min-w-full border-collapse ${className}`}>{children}</table>
      </div>
    </div>
  );
};

// TableHeader Component
export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = "" }) => {
  return <thead className={`border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-gray-900/50 ${className}`}>{children}</thead>;
};

// TableBody Component
export const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return <tbody className={`divide-y divide-gray-100 dark:divide-white/[0.05] ${className}`}>{children}</tbody>;
};

// TableRow Component
export const TableRow: React.FC<TableRowProps> = ({ children, className = "", ...props }) => {
  return <tr className={`hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors duration-150 ${className}`} {...props}>{children}</tr>;
};


// TableCell Component
export const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
  ...props
}) => {
  const CellTag = isHeader ? "th" : "td";
  const baseStyles = isHeader
    ? "px-5 py-3 font-medium text-gray-500 dark:text-gray-400 text-start text-xs uppercase tracking-wider"
    : "px-5 py-4 text-sm text-gray-700 dark:text-gray-300 text-start";
  
  return (
    <CellTag colSpan={colSpan} className={`${baseStyles} ${className}`} {...(props as any)}>
      {children}
    </CellTag>
  );
};
