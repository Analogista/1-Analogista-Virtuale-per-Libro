import React, { ReactNode } from 'react';

interface InfoBoxProps {
    children: ReactNode;
    className?: string;
    variant?: 'info' | 'warning';
}

const InfoBox: React.FC<InfoBoxProps> = ({ children, className, variant = 'info' }) => {
    const baseClasses = 'border-l-4 p-4 my-4 rounded-r-lg';
    
    const variantClasses = {
        info: 'bg-blue-50 border-blue-500 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-800'
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}>
            {children}
        </div>
    );
}

export default InfoBox;