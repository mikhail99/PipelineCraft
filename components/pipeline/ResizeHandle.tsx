import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
    direction?: 'horizontal' | 'vertical';
    onResize: (size: number) => void;
    minSize?: number;
    maxSize?: number;
    theme?: string;
}

export default function ResizeHandle({
    direction = 'horizontal',
    onResize,
    minSize = 150,
    maxSize = 600,
    theme = 'dark',
}: ResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (direction === 'horizontal') {
                const newSize = Math.max(minSize, Math.min(maxSize, e.clientX));
                onResize(newSize);
            } else {
                const newSize = Math.max(minSize, Math.min(maxSize, window.innerHeight - e.clientY));
                onResize(newSize);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, direction, onResize, minSize, maxSize]);

    return (
        <div
            onMouseDown={handleMouseDown}
            className={cn(
                'shrink-0 transition-colors',
                direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
                theme === 'light'
                    ? 'bg-gray-300 hover:bg-blue-400'
                    : 'bg-slate-700/50 hover:bg-cyan-500/50',
                isDragging && (theme === 'light' ? 'bg-blue-500' : 'bg-cyan-500')
            )}
        />
    );
}