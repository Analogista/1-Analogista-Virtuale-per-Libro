
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img 
    src="/assets/logopac.29.36.webp" 
    alt="Logo Analogista Virtuale" 
    className={className}
    referrerPolicy="no-referrer"
  />
);

export default Logo;
