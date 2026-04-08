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
        <CardHeader action={action}>
          {title && <h3 className="text-xl font-semibold text-gray-800">{title}</h3>}
        </CardHeader>
      )}
      <div>{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ children, className = '', action }) => (
  <div className={`p-6 border-b flex items-center justify-between ${className}`}>
    <div>{children}</div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);
