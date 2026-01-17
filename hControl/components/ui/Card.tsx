import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    className = '',
    glass = false,
    hoverable = false,
    padding = 'md',
    ...props
}: CardProps) {
    const baseStyles = 'rounded-xl border transition-all duration-200';

    const glassStyles = glass
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200 dark:border-gray-800'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800';

    const hoverStyles = hoverable
        ? 'hover:shadow-md transition-shadow cursor-pointer'
        : 'shadow-sm';

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div className={`${baseStyles} ${glassStyles} ${hoverStyles} ${paddingStyles[padding]} ${className}`} {...props}>
            {children}
        </div>
    );
}
