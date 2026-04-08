import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, fullWidth, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variantStyles = {
      primary: 'bg-accent-gold text-black hover:bg-accent-gold-light hover:shadow-gold-glow hover:scale-[1.02] active:scale-95 focus:ring-4 focus:ring-accent-gold/20',
      secondary: 'bg-corporate-800 text-corporate-50 hover:bg-corporate-700 focus:ring-4 focus:ring-corporate-700/50',
      outline: 'border-2 border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10 hover:border-accent-gold focus:ring-4 focus:ring-accent-gold/10',
      danger: 'bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/40 hover:shadow-lg hover:shadow-red-500/10 focus:ring-4 focus:ring-red-500/20'
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2.5',
      lg: 'px-8 py-4 text-base rounded-2xl gap-3'
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
