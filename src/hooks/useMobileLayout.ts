import { useState, useEffect } from 'react';

export type MobileView = 'editor' | 'preview' | 'files';

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('editor');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, mobileView, setMobileView };
}
