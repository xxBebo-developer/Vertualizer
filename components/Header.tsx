
import React from 'react';
import * as Icon from './IconComponents.tsx';

export const Header: React.FC = () => {
  return (
    <header className="bg-brand-surface p-4 shadow-md">
      <div className="container mx-auto flex items-center gap-3">
        <Icon.MusicIcon className="text-brand-primary h-8 w-8" />
        <h1 className="text-2xl font-bold text-brand-text">
          AI Audio <span className="text-brand-primary">Visualizer</span>
        </h1>
      </div>
    </header>
  );
};