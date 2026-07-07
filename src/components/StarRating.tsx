import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}

const StarRating: React.FC<Props> = ({ value, onChange, size = 20, readOnly = false }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className={readOnly ? 'inline-flex' : 'inline-flex'} role={readOnly ? undefined : 'radiogroup'} aria-label={`Puntaje: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          aria-checked={value === n}
          role={readOnly ? undefined : 'radio'}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star size={size} className={n <= shown ? 'text-amber-400' : 'text-zinc-700'} fill={n <= shown ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
