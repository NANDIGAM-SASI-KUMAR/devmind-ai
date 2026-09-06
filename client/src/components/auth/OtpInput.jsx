import { useRef } from 'react';

export default function OtpInput({ length = 6, value, onChange, autoFocus }) {
  const inputRefs = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const setDigit = (index, char) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(''));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    const chars = raw.split('');
    let i = index;
    for (const c of chars) {
      if (i >= length) break;
      setDigit(i, c);
      i += 1;
    }
    const nextIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, '');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(raw.padEnd(value.length, '').slice(0, length) || raw);
    if (raw) {
      const focusIndex = Math.min(raw.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="otp-box w-full aspect-square rounded-xl text-center text-xl font-semibold"
        />
      ))}
    </div>
  );
}
