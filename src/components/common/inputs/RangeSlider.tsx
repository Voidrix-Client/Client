import React from 'react';

interface RangeSliderProps {
    label: React.ReactNode;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    icon?: React.JSX.Element;
}

const RangeSlider = React.memo(function RangeSlider({label, value, min = 0, max = 100, step = 1, unit = '', onChange, icon}: RangeSliderProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center gap-2 flex-wrap">
                <label className="text-sm font-medium text-muted-foreground min-w-0 break-words">
                    {label}
                </label>
                <span
                    className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {value}{unit}
                </span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider-thumb"
                    style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`
                    }}
                />
            </div>
        </div>
    );
});

export default RangeSlider;