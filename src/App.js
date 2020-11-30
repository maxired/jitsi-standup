/* global JitsiMeetJS config*/
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import $ from 'jquery'
import { Seat } from './components/Seat';
import { ConnectForm } from './components/ConnectForm';
import { Audio } from './components/Audio';
import useWindowSize from './hooks/useWindowSize'

import qs from 'qs'

window.$  = $

const JITSI_STANDUP_POSITION = 'jitsi_standup_position';
const JITSI_STANDUP_AVATAR = 'jitsi_standup_avatar';


const connect = async ({ domain, room, config }) => {
  const connectionConfig = Object.assign({}, config);
  let serviceUrl = connectionConfig.websocket || connectionConfig.bosh;

  serviceUrl += `?room=${room}`;
  if(serviceUrl.indexOf('//') === 0){
    serviceUrl = `https:${serviceUrl}`
  }
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

const join = async ({ connection, room, setupListeners }) => {
  const conference = connection.initJitsiConference(room, {});

  return new Promise(resolve => {
    setupListeners(conference);
    
    conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, () => resolve(conference));
    conference.join();
  })
}

const connectandJoin = async ({ domain, room, config, setupListeners }) => {

  const connection = await connect({ domain, room, config })
  const localTracks = await JitsiMeetJS.createLocalTracks({ devices: ['video', 'audio'], facingMode: 'user'}, true);

  const conference = await join({ connection, room, setupListeners })
  const localTrack = localTracks.find(track => track.getType() === 'video')
  conference.addTrack(localTrack)
  const localAudioTrack = localTracks.find(track => track.getType() === 'audio')
  conference.addTrack(localAudioTrack)

  return { connection, conference, localTrack }
}

const loadAndConnect = ({ domain, room, setupListeners }) => {

    return new Promise(( resolve ) => {
      const script = document.createElement('script')
      script.onload = () => {
        JitsiMeetJS.init();

        const configScript = document.createElement('script')
        configScript.src = `https://${domain}/config.js`;
        document.querySelector('head').appendChild(configScript);
        configScript.onload = () => {
          connectandJoin({ domain, room, config, setupListeners }).then(resolve)
        }       
      };

      script.src = `https://${domain}/libs/lib-jitsi-meet.min.js`;
      document.querySelector('head').appendChild(script);
    })
}

const useTracks = () => {
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

  return [tracks, addTrack, removeTrack]
}

const getDefaultParamsValue = () => {
  const params = document.location.search.length > 1 ? qs.parse(document.location.search.slice(1)) : {}
  return {
    room: params.room ?? 'daily_standup',
    domain: params.domain ?? 'meet.jit.si',
    autoJoin: params.autojoin ?? false,
  }
}

function App() {

  useWindowSize()
  const defaultParams = useMemo(getDefaultParamsValue, [])

  const [mainState, setMainState] = useState('init')
  const [domain, setDomain] = useState(defaultParams.domain)
  const [room, setRoom] = useState(defaultParams.room)
  const [conference, setConference] = useState(null)
  const [videoTracks, addVideoTrack, removeVideoTrack] = useTracks();
  const [audioTracks, addAudioTrack, removeAudioTrack] = useTracks();
  
  const localSeatRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(() => {
      if(localSeatRef.current) { 
        localSeatRef.current.getCanvasUrl((_, data) => {
          conference.setLocalParticipantProperty(JITSI_STANDUP_AVATAR, data)
        })
      }
    }, 5000)
  
    return () => {
      clearInterval(interval)
    }
  }, [conference])

  const addTrack = useCallback((track) => {
    if(track.getType() === 'video') addVideoTrack(track)
    if(track.getType() === 'audio') addAudioTrack(track)
  }, [ addVideoTrack, addAudioTrack ])

  const removeTrack = useCallback((track) => {
    if(track.getType() === 'video') removeVideoTrack(track)
    if(track.getType() === 'audio') removeAudioTrack(track)
  }, [removeAudioTrack, removeVideoTrack])

  const [participantProperties, setParticipantsProperties] = useState({});

  const updateProperty = useCallback((participant, propertyName, oldValue, value) => {
    const participantId = participant.getId();
    setParticipantsProperties(state => ({...state, [participantId]: { ...(state[participantId]||{}), [propertyName]:value } }))
  }, [])

  const connect = useCallback(async (e) => {
    e && e.preventDefault()
    setMainState('loading')

    const setupListeners = (conference) => {
      conference.on(JitsiMeetJS.events.conference.USER_JOINED, (id, participant) => {
        setParticipantsProperties(state => ({...state, [id]: participant._properties}))
      })
    }
  
    const { connection, conference, localTrack } = await loadAndConnect({ domain, room, setupListeners });
    setMainState('started')
    setConference(conference)
    addTrack(localTrack)
  }, [addTrack, domain, room]);

  useEffect(() => {
    if(!conference) return

    conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, addTrack)
    conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, removeTrack)
    conference.on(JitsiMeetJS.events.conference.PARTICIPANT_PROPERTY_CHANGED, updateProperty)


    
  }, [addTrack, conference, removeTrack, updateProperty])

  useEffect(() => {
    if(defaultParams.autoJoin || defaultParams.autoJoin === ''){
      connect()
    }
  }, [connect, defaultParams.autoJoin])

  const [localposition, setLocalPosition] = useState({ x: 0, y: 0})
  const onClick = useCallback((e) => {
    const position = { x: e.clientX, y:e.clientY}
    setLocalPosition(position)
    conference.setLocalParticipantProperty(JITSI_STANDUP_POSITION, JSON.stringify(position))
  }, [conference])

  return (
    <div className="App" >
      <header className="App-header">
        { mainState === 'init' && <ConnectForm connect={connect} domain={domain} room={room} setRoom={setRoom} setDomain={setDomain} /> }
        { mainState === 'loading' && 'Loading' }
        { mainState === 'started' &&
        <div
        onClick={onClick}
        style={{
          height: '100vh', width: '100vw',
          backgroundColor: 'rgba(0, 100,100, 1)',
          backgroundImage: 'url(/jitsi-standup/table.png)',
          position: 'relative'
      }} >
        {
          videoTracks.map((track, index) => <Seat
            ownRef={track.isLocal() ? localSeatRef : null}
            avatarUrl={getParticipantAvatarUrl(track, participantProperties)}
            localposition={localposition}
            position={ getParticipantPositionForTrack(track, localposition, participantProperties)} track={track} index={index} length={videoTracks.length} key={track.getId()} />)
        }
        {
          audioTracks.map((track, index) => <Audio    
          localposition={localposition}
          position={ getParticipantPositionForTrack(track, localposition, participantProperties)}
          track={track} index={index} key={track.getId()} />)
        }
       </div>}
      </header>
    </div>
  );
}

const DEFAULT_POSITION =  { x: 0, y : 0 }
const getParticipantPositionForTrack = (track, localposition, participantsProperties) => {
  if(track.isLocal()) {
    return localposition
  }
  const participantId = track.getParticipantId();

  const participantProperties = participantsProperties[participantId];

  if(!participantProperties) return DEFAULT_POSITION

  try{
    const participantPosition = JSON.parse(participantProperties[JITSI_STANDUP_POSITION])
    console.error( 'positionis',participantPosition )
    return participantPosition
  } catch (e) { 
    console.error( 'positionis',e )
    return DEFAULT_POSITION}
};

const getParticipantAvatarUrl = (track, participantsProperties = {})=> {
  const participantId = track?.getParticipantId();

  const participantProperties = participantsProperties[participantId];

  return participantProperties?.[JITSI_STANDUP_AVATAR] ?? 'https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng'

};

export default App;