export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    const sizeStyles = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    return (
        <div className={`inline-block ${className}`}>
            <svg
                className={`animate-spin ${sizeStyles[size]} text-primary-600`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
}

export interface LoadingProps {
    text?: string;
    fullScreen?: boolean;
}

export function Loading({ text = 'Betöltés...', fullScreen = false }: LoadingProps) {
    const containerClass = fullScreen
        ? 'fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50'
        : 'flex flex-col items-center justify-center py-12';

    return (
        <div className={containerClass}>
            <Spinner size="lg" />
            {text && (
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
                    {text}
                </p>
            )}
        </div>
    );
}
