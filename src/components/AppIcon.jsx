import React from 'react';
import { CustomIcon, DuoAppLogo } from './DuoIcons';

export { CustomIcon, DuoAppLogo };

export const AppIcon = ({ size = 22, className = '' }) => {
  return <DuoAppLogo size={size} className={className} />;
};

export default AppIcon;
