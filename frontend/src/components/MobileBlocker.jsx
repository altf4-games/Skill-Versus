import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

const MobileBlocker = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen size
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
        'windows phone', 'mobile', 'webos', 'opera mini'
      ];
      
      const isMobileUserAgent = mobileKeywords.some(keyword => 
        userAgent.includes(keyword)
      );
      
      // Check if screen is too small (mobile/tablet size)
      const isSmallScreen = screenWidth < 1024 || screenHeight < 600;
      
      // Check touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if any of these conditions are true
      const mobile = isMobileUserAgent || (isSmallScreen && isTouchDevice);
      
      setIsMobile(mobile);
    };

    // Check on mount
    checkDevice();
    
    // Check on resize
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Monitor className="h-16 w-16 text-blue-400" />
              <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Desktop Required
          </h1>
          
          <p className="text-gray-300 mb-6 leading-relaxed">
            SkillVersus is best experienced on desktop computers. Our competitive programming 
            environment requires a full keyboard, larger screen, and desktop browser features 
            for the optimal coding experience.
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 text-gray-300">
              <Monitor className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-sm">Full keyboard for efficient coding</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Monitor className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-sm">Large screen for code editor and problem view</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-300">
              <Monitor className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-sm">Advanced browser features for contests</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-blue-200 text-sm">
              <strong>💡 Tip:</strong> Access SkillVersus from your computer for the full 
              competitive programming experience with contests, duels, and advanced features.
            </p>
          </div>
          
          <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400 text-xs">
            <Tablet className="h-4 w-4" />
            <span>Tablets and mobile devices are not supported</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default MobileBlocker;
