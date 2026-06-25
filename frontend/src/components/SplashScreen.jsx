import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1800); // 1.8s matching animation times

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-container">
      <img 
        src="/logos/05_logo_monocromatico_blanco.png" 
        alt="Rutas Inseguras Logo" 
        className="splash-logo"
      />
      <div className="splash-slogan">
        Movilízate con información
      </div>
    </div>
  );
}
