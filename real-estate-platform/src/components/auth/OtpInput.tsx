'use client';

import { useRef, useState, useCallback, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  isRTL?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  hasError = false,
  isRTL = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Split value string into array of chars
  const digits = value.padEnd(length, '').split('').slice(0, length);

  const focusInput = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
  }, [length]);

  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, ''); // digits only
      if (!raw) return;

      const newDigits = [...digits];

      if (raw.length > 1) {
        // Handle paste via input change (some mobile keyboards)
        const pasted = raw.slice(0, length - index);
        for (let i = 0; i < pasted.length; i++) {
          if (index + i < length) newDigits[index + i] = pasted[i];
        }
        onChange(newDigits.join(''));
        focusInput(Math.min(index + pasted.length, length - 1));
      } else {
        newDigits[index] = raw[0];
        onChange(newDigits.join(''));
        if (index < length - 1) focusInput(index + 1);
      }
    },
    [digits, length, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newDigits = [...digits];
        if (newDigits[index]) {
          newDigits[index] = '';
          onChange(newDigits.join(''));
        } else if (index > 0) {
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
          focusInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusInput(isRTL ? index + 1 : index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusInput(isRTL ? index - 1 : index + 1);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    },
    [digits, onChange, focusInput, isRTL]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;
      const newDigits = pasted.padEnd(length, '').split('').slice(0, length);
      // Fill from start
      const filled = [...digits];
      for (let i = 0; i < pasted.length; i++) filled[i] = pasted[i];
      onChange(filled.join(''));
      focusInput(Math.min(pasted.length, length - 1));
    },
    [digits, length, onChange, focusInput]
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    // Select existing digit on focus
    inputRefs.current[index]?.select();
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return (
    <div
      className="flex items-center justify-center gap-3"
      dir="ltr" // Always LTR for digit order
      role="group"
      aria-label="OTP input"
    >
      {Array.from({ length }, (_, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!digits[index];

        return (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            disabled={disabled}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1}`}
            className={[
              'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none',
              'transition-all duration-200 select-none',
              'font-mono tracking-widest',
              disabled
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : hasError
                ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : isFocused
                ? 'border-primary-500 bg-primary-50 text-primary-800 ring-2 ring-primary-200 scale-105'
                : hasValue
                ? 'border-primary-400 bg-white text-dark-800 shadow-sm'
                : 'border-gray-300 bg-white text-dark-800 hover:border-primary-300',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
