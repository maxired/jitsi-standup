import React, { useState, useEffect, useRef } from 'react';

export const Audio = ({ track, index, position, localposition }) => {
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

  if (track && track.isLocal())
    return null;
  return <audio autoPlay='1' ref={ref} />;
};
