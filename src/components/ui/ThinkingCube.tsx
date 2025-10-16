import React from 'react';

interface ThinkingCubeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const ThinkingCube: React.FC<ThinkingCubeProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative thinking-cube`}>
        {/* Main cube face with glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm shadow-lg cube-face" />
        
        {/* Top face highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-sm opacity-60 transform -translate-y-px -translate-x-px" />
        
        {/* Side face shadow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-purple-800 rounded-sm opacity-40 transform translate-y-px translate-x-px" />
        
        {/* Pulsing inner core */}
        <div className="absolute inset-1 bg-white rounded-sm opacity-30 animate-pulse" />
        
        {/* Small highlight dot */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-70 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
};