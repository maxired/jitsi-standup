import React from 'react';
export const Audio = ({ track, index }) => {
  if (track && track.isLocal())
    return null;
  return <audio autoPlay='1' ref={(ref) => ref && track.attach(ref)} />;
};
