import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, onClick }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md ${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="flex items-center justify-between p-6 border-b">
          {title && <h3 className="text-xl font-semibold text-gray-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title || action ? 'p-6' : ''}>{children}</div>
    </div>
  );
};
