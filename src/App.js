/* global JitsiMeetJS config*/
import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import $ from 'jquery'
import { Seat } from './components/Seat';
import { ConnectForm } from './components/ConnectForm';
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

export default App;