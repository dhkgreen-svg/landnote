'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AreaInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export function AreaInput({ label, value, onChange }: AreaInputProps) {
  const [unit, setUnit] = useState<'m2' | 'py'>('py');
  const [localValue, setLocalValue] = useState(() => {
    if (!value) return '';
    return (Number(value) * 0.3025).toFixed(2);
  });

  // Sync external value when it changes (e.g. initial load or reset)
  useEffect(() => {
    if (value === '') {
      setLocalValue('');
    } else if (unit === 'm2') {
      if (Number(value) !== Number(localValue)) {
        setLocalValue(value);
      }
    } else {
      // If unit is PY, and parent M2 changes, update local PY
      const py = (Number(value) * 0.3025).toFixed(2);
      // Only update if mathematically different to avoid overriding "30." with "30.00"
      if (Math.abs(Number(py) - Number(localValue)) > 0.01) {
        setLocalValue(py);
      }
    }
  }, [value, unit]);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setLocalValue(raw);

    if (raw === '') {
      onChange('');
      return;
    }

    const num = Number(raw);
    if (unit === 'm2') {
      onChange(raw);
    } else {
      // Input is PY, convert to M2 for the parent
      const toM2 = (num / 0.3025).toFixed(2);
      onChange(toM2);
    }
  };

  const handleUnitToggle = (newUnit: 'm2' | 'py') => {
    if (unit === newUnit) return;
    
    if (localValue !== '') {
      const num = Number(localValue);
      if (newUnit === 'py') {
        setLocalValue((num * 0.3025).toFixed(2));
      } else {
        setLocalValue((num / 0.3025).toFixed(2));
      }
    }
    setUnit(newUnit);
  };

  const m2Value = value ? Number(value) : 0;
  const pyValue = m2Value * 0.3025;
  const subText = value === '' 
    ? '' 
    : unit === 'm2' 
      ? `약 ${pyValue.toFixed(2)} 평` 
      : `약 ${m2Value.toFixed(2)} m²`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} {unit === 'py' ? '(평)' : '(m²)'}</Label>
        <div className="flex gap-2 text-xs">
          <button 
            type="button" 
            onClick={() => handleUnitToggle('m2')} 
            className={`transition-colors ${unit === 'm2' ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            m²
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            type="button" 
            onClick={() => handleUnitToggle('py')} 
            className={`transition-colors ${unit === 'py' ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            평
          </button>
        </div>
      </div>
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={handleLocalChange}
          className="pr-12"
          placeholder={unit === 'm2' ? '0.00' : '0.0'}
        />
        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
          {unit === 'm2' ? 'm²' : '평'}
        </span>
      </div>
      {subText && (
        <p className="text-xs text-muted-foreground">
          {subText}
        </p>
      )}
    </div>
  );
}
