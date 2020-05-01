import React, { useCallback } from 'react';
import { Button, TextField } from '@material-ui/core';

const useOnChange = (setter) => useCallback(e => setter(e.target.value), [setter])

export const ConnectForm = ({ connect, room, domain, setDomain, setRoom }) => {

  const onDomainChange = useOnChange(setDomain)
  const onRoomChange = useOnChange(setRoom)

return (
<form noValidate autoComplete="off" onSubmit={connect}>
  <TextField label="Jitsi instance" placeholder='https://meet.jit.si' value={domain} onChange={onDomainChange}/><br />
  <TextField label="room name" value={room} placeholder='daily standup' onChange={onRoomChange} /><br />
  <Button type="submit" color="primary">Join</Button>
</form>);

}
