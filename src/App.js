/* global JitsiMeetJS config*/
import React, { useState, useCallback, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, TextField, Hidden } from '@material-ui/core';
import $ from 'jquery'

window.$  = $

const connect = async ({ domain, room, config }) => {
  const connectionConfig = Object.assign({}, config);
  let serviceUrl = connectionConfig.websocket || connectionConfig.bosh;

  serviceUrl += `?room=${room}`;

  connectionConfig.serviceUrl = connectionConfig.bosh = serviceUrl;
  
  return new Promise((resolve, reject) => {
    const connection = new JitsiMeetJS.JitsiConnection(null, undefined, connectionConfig);
    console.log('JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED', JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED)
    connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      () => resolve(connection));
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, reject);
    connection.connect();
  }) 
}

const join = async ({ connection, room }) => {
  const conference = connection.initJitsiConference(room, {});

  return new Promise(resolve => {
    conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => resolve(conference));
    conference.join();
  })
}

const connectandJoin = async ({ domain, room, config }) => {

  const connection = await connect({ domain, room, config })
  const localTracks = await JitsiMeetJS.createLocalTracks({ devices: ['video'], facingMode: 'user'}, true);

  const conference = await join({ connection, room })
  const localTrack = localTracks.find(track => track.getType() === 'video')
  conference.addTrack(localTrack)
  return { connection, conference, localTrack }
}

const loadAndConnect = ({ domain, room}) => {

    return new Promise(( resolve ) => {
      const script = document.createElement('script')
      script.onload = () => {
        JitsiMeetJS.init();

        const configScript = document.createElement('script')
        configScript.src = `https://${domain}/config.js`;
        document.querySelector('head').appendChild(configScript);
        configScript.onload = () => {
          connectandJoin({ domain, room, config }).then(resolve)
        }       
      };

      script.src = `https://${domain}/libs/lib-jitsi-meet.min.js`;
      document.querySelector('head').appendChild(script);
    })
}


function App() {

  const [mainState, setMainState] = useState('init')
  const [domain, setDomain] = useState('meet.jit.si')
  const [room, setRoom] = useState('max_daily_standup')
  const [conference, setConference] = useState(null)
  const [tracks, setTracks] = useState([])
  
  const addTrack = useCallback((track) => {
    console.log('addtrack', { track }, track.getId())
    setTracks((tracks) => {
      const hasTrack = tracks.find(_track => track.getId() === _track.getId())

      if(hasTrack) return tracks;

      return [...tracks, track]
      
    });
  }, [setTracks])

  const removeTrack = useCallback((track) => {
    setTracks((tracks) => tracks.filter(_track => track.getId() !== _track.getId()))
  }, [setTracks])


  const connect = useCallback(async (e) => {
    e.preventDefault()
    setMainState('loading')
    const { connection, conference, localTrack } = await loadAndConnect({ domain, room });
    setMainState('started')
    setConference(conference)
    addTrack(localTrack)
  }, [addTrack, domain, room]);

  useEffect(() => {
    if(!conference) return

    conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, addTrack)
    conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, removeTrack)
    
  }, [addTrack, conference, removeTrack])

  return (
    <div className="App">
      <div id="meet" />
      <header className="App-header">
        { mainState === 'init' && <ConnectForm connect={connect} domain={domain} room={room} /> }
        { mainState === 'loading' && 'Loading' }
        { mainState === 'started' &&
        <div style={{
          height: '100vh', width: '100vw', maxHeight: '100vw', maxWidth: '100vh',
          background: 'rgba(0, 100,100, 1)',
          position: 'relative',
          borderRadius: '100%'
      }}>
        {
          tracks.map((track, index) => <Seat track={track} index={index} length={tracks.length} />)
        }
       </div>}
        
      </header>
    </div>
  );
}


const ConnectForm = ({ connect , room, domain }) =>

  <form noValidate autoComplete="off" onSubmit={connect}>
<TextField label="Jitsi instance" placeholder='https://meet.jit.si' defaultValue={domain} /><br/>
<TextField label="room name" defaultValue={room} placeholder='daily standup' /><br/>
<Button type="submit" color="primary">Join</Button>
</form>
export default App;


const getWidthForSeats = seats => {
  const fullWIdth = Math.min(window.innerHeight, window.innerWidth);

  switch (seats) {
  case 0: return 0;
  case 1: return fullWIdth;
  case 2: return fullWIdth / 2;
  case 3: return fullWIdth / (1 + 2/ Math.sqrt(3));
  case 4: return fullWIdth / ( 1 + Math.sqrt(2));
  case 5: return fullWIdth / ( 1 + Math.sqrt(2 * (1 + 1/Math.sqrt(5))));
  case 6: return fullWIdth / 3;
  case 7: return fullWIdth / 4;
  default: return fullWIdth / 4;
  }
};


const getDistanceRatioForSeats = seats => {
  if(seats < 2) return 0;

  const width = getWidthForSeats(seats);

  const fullWIdth = Math.min(window.innerHeight, window.innerWidth);

  return 50 - width/2 / fullWIdth * 100
};

const Circle = ({ vertical, horizontal, size, ...props }) => (
  <div style={{
    position: 'absolute',
    display: 'flex', height: size, width: size, borderRadius: size, overflow: 'hidden',justifyContent: 'center',
    top: `calc(50% - ${size}px/2  + ${vertical}%)`,
    left: `calc(50% - ${size}px/2 + ${horizontal}%)`,
    }} {...props} />) 

const Seat = ({  track, index, length }) => {

  const seatSize = getWidthForSeats(length)
  const disanceRatio = getDistanceRatioForSeats(length)

  const angle = (360 / length) * index;
  const horizontal = Math.cos(angle * 2 * Math.PI / 360) * disanceRatio;
  const vertical = Math.sin(angle * 2 * Math.PI / 360) * disanceRatio;

return (<Circle size={seatSize} horizontal={horizontal} vertical={vertical}>
  <video height={seatSize} style={{flexShrink: 0 }}autoPlay='1' key={`track_${track.getId()}`} 
          ref={(ref) => ref && track.attach(ref)} />
</Circle>)

}