import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-corporate-400 group-focus-within:text-accent-500 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all duration-300 outline-none shadow-sm text-sm placeholder:text-corporate-400 ${error
                ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                : 'border-corporate-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10'
              } ${icon ? 'pl-11' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
