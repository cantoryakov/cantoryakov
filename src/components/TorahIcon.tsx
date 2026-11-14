import React from 'react';
import { TORAH_IMAGE_URL } from '../constants/assets';

interface TorahIconProps {
  className?: string;
  alt?: string;
}

export const TorahIcon: React.FC<TorahIconProps> = ({
  className = 'w-6 h-6 object-contain',
  alt = 'Torah scroll',
}) => {
  return (
    <img
      src={TORAH_IMAGE_URL}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};
