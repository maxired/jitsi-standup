import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Circle } from './Circle';

import { getWidthForSeats } from '../utils';

export const Seat = function({ ownRef, avatarUrl, track, index, length, position, localposition }) {
  const seatSize = Math.min(300, getWidthForSeats(length));
  
  const ref = useRef(null);

  const getCanvasUrl = useCallback((callback) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 170/2;
    canvas.height = 302/2;
    
    const widthRatio = ref.current.videoWidth / ref.current.clientWidth;
    context.drawImage(ref.current,
      (ref.current.videoWidth - 170 * widthRatio)/2, 0, 170 * widthRatio, ref.current.videoHeight,
      0, 0, 170/2, 302/2);

    const data = canvas.toDataURL()
    callback(null, data)
  }, [])

  if(ownRef) {
    ownRef.current = { getCanvasUrl };
  }
  
  const [shouldAttach, setShouldAttach] = useState(false);
  useEffect(() => {
    if(!ref.current) return;

    const dist = Math.sqrt(Math.pow(position.x - localposition.x, 2) + Math.pow(position.y - localposition.y, 2));
    setShouldAttach(dist < 400)

  }, [track, position, localposition]);

  useEffect(() => {
    if(!ref.current) return;

    if(shouldAttach){
      track.attach(ref.current)
    }else {
      track.detach(ref.current)
    }
  }, [shouldAttach, track])

  return (<Circle size={seatSize} position={position}>
    <video
      height={seatSize}
      style={{ flexShrink: 0, backgroundImage: `url(${avatarUrl})`, backgroundPosition: 'center', backgroundSize: 'contain' }} autoPlay='1' key={`track_${track.getId()}`} ref={ref} />
  </Circle>);
};
