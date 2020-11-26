import React from 'react';
export const Circle = ({ vertical, horizontal, size, localposition, ...props }) => (<div style={{
  position: 'fixed',
  display: 'flex', height: size, width: size / 16 * 9, borderRadius: 15, overflow: 'hidden', justifyContent: 'center',
  top: `calc(${localposition.y}px - ${size}px/2)`,
  
  //`calc(50% - ${size}px/2  + ${vertical}%)`,
  left: `calc(${localposition.x}px - ${size/16*9}px/2)`
  // `calc(50% - ${size}px/2 + ${horizontal}%)`,
}} {...props} />);
