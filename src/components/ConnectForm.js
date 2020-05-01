import React from 'react';
import { Button, TextField } from '@material-ui/core';
export const ConnectForm = ({ connect, room, domain }) => <form noValidate autoComplete="off" onSubmit={connect}>
  <TextField label="Jitsi instance" placeholder='https://meet.jit.si' defaultValue={domain} /><br />
  <TextField label="room name" defaultValue={room} placeholder='daily standup' /><br />
  <Button type="submit" color="primary">Join</Button>
</form>;
