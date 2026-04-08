import { TextareaHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { countWords } from '../../lib/courseService';

interface TextareaWithLimitProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  wordLimit?: number;
  showWordCount?: boolean;
}

export const TextareaWithLimit = forwardRef<HTMLTextAreaElement, TextareaWithLimitProps>(
  ({ label, error, helperText, wordLimit, showWordCount = true, className = '', value, onChange, ...props }, ref) => {
    const [wordCount, setWordCount] = useState(0);

    useEffect(() => {
      if (value && typeof value === 'string') {
        setWordCount(countWords(value));
      } else {
        setWordCount(0);
      }
    }, [value]);

    const isOverLimit = wordLimit !== undefined && wordCount > wordLimit;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 resize-none ${
            error || isOverLimit
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          } ${className}`}
          {...props}
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {isOverLimit && !error && (
              <p className="text-sm text-red-600">Word limit exceeded</p>
            )}
            {helperText && !error && !isOverLimit && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
          {showWordCount && wordLimit !== undefined && (
            <p className={`text-sm ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              {wordCount} / {wordLimit} words
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextareaWithLimit.displayName = 'TextareaWithLimit';
