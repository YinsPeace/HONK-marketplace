// Portrait renderer adapted from omer-bar's DFK-Hero-Viewer (ISC) via the dfk-classic/hero-viewer fork.
import React from 'react';
import HeroFigure from './components/HeroFigure';
import { adaptHeroToViewerProps } from './geneAdapter';

export default function HeroPortrait({ hero }) {
  const viewerProps = adaptHeroToViewerProps(hero);
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <HeroFigure {...viewerProps} />
    </div>
  );
}
