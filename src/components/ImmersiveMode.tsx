
import React from 'react';

interface Props {
    children: React.ReactNode;
    isActive?: boolean;
}

// Componente svuotato della logica "ImmersiveMode" (niente audio 432Hz, niente sfondo scuro)
const ImmersiveMode: React.FC<Props> = ({ children }) => {
    return (
        <>
            {children}
        </>
    );
};

export default ImmersiveMode;
