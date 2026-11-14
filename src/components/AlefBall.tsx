import React from 'react';

interface AlefBallIconProps {
  size?: number;
  className?: string;
  letter?: string;
}

export const AlefBallIcon: React.FC<AlefBallIconProps> = ({
  size = 44,
  className = '',
  letter = 'א',
}) => {
  const borderWidth = Math.max(2, Math.round(size * 0.055));
  const bandHeight = Math.max(2, Math.round(size * 0.07));
  const btnSize = Math.round(size * 0.34);
  const btnBorder = Math.max(2, Math.round(size * 0.045));
  const fontSize = Math.round(size * 0.17);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: `${borderWidth}px solid #0f1c3f`,
        overflow: 'hidden',
        boxShadow: `0 ${Math.max(2, Math.round(size * 0.07))}px 0 #1e3a8a`,
        backgroundColor: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {/* Top Half: Blue Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: '#1d4ed8',
          backgroundImage: 'linear-gradient(180deg, #2563eb 0%, #1e40af 100%)',
        }}
      />

      {/* Top Specular Glint */}
      <div
        style={{
          position: 'absolute',
          top: `${size * 0.11}px`,
          left: `${size * 0.16}px`,
          width: `${size * 0.3}px`,
          height: `${size * 0.16}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          transform: 'rotate(-25deg)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom Half: Clean White / Soft Metallic Base */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          backgroundColor: '#f8fafc',
          backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
        }}
      />

      {/* Dark Divider Band */}
      <div
        style={{
          position: 'absolute',
          top: `calc(50% - ${bandHeight / 2}px)`,
          left: 0,
          right: 0,
          height: `${bandHeight}px`,
          backgroundColor: '#0f1c3f',
          zIndex: 3,
        }}
      />

      {/* Optically Centered Release Button */}
      <div
        style={{
          position: 'absolute',
          width: `${btnSize}px`,
          height: `${btnSize}px`,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          border: `${btnBorder}px solid #0f1c3f`,
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            color: '#1d4ed8',
            fontFamily: '"Akoderf", sans-serif',
            lineHeight: 1,
            marginTop: '-2px',
            userSelect: 'none',
          }}
        >
          {letter}
        </span>
      </div>
    </div>
  );
};

export default AlefBallIcon;