import React from 'react';
export const Circle = ({ size, position, ...props }) => (<div style={{
  position: 'fixed',
  border: '1px solid #222',
  display: 'flex', height: size, width: size / 16 * 9, borderRadius: 15, overflow: 'hidden', justifyContent: 'center',
  top: `calc(${position.y}px - ${size}px/2)`,
  left: `calc(${position.x}px - ${size/16*9}px/2)`
}} {...props} />);
