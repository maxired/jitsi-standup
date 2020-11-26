import React, { useState, useEffect, useRef } from 'react';
import { Circle } from './Circle';

import { getWidthForSeats } from '../utils';

export const Seat = ({ track, index, length, position, localposition }) => {
  const seatSize = Math.min(300, getWidthForSeats(length));
  
  const ref = useRef(null);

  const [shouldAttach, setShouldAttach] = useState(false);
  useEffect(() => {
    if(!ref.current) return;

    const dist = Math.sqrt(Math.pow(position.x - localposition.x, 2) + Math.pow(position.y - localposition.y, 2));
    setShouldAttach(dist < 300)

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
    <video height={seatSize} style={{ flexShrink: 0 }} autoPlay='1' key={`track_${track.getId()}`} ref={ref} />
  </Circle>);
};
