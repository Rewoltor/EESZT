import ReactMarkdown from 'react-markdown';


interface FormattedTextProps {
    content: string;
    className?: string;
}

export function FormattedText({ content, className = '' }: FormattedTextProps) {
    return (
        <div className={`formatted-text ${className}`}>
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}
