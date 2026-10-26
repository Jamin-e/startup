import React from 'react';

import Button from 'react-bootstrap/Button';
import { MessageDialog } from './messageDialog';

export function Unauthenticated(props) {
    const [userName, setUserName] = React.useState(props.userName || '');
    const [password, setPassword] = React.useState('');
    const [displayError, setDisplayError] = React.useState(null);

    async function loginUser() {
        await loginOrCreate(`/api/auth/login`);
    }

    async function createUser() {
        await loginOrCreate(`/api/auth/create`);
    }

    async function loginOrCreate(endpoint) {
        setDisplayError(null);
        try {
            const response = await fetch(endpoint, {
                method: 'post',
                body: JSON.stringify({email: userName, password: password}),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });
            if (response?.status === 200) {
                localStorage.setItem('userName', userName);
                props.onLogin(userName);
                return;
            }
                const body = await response.json().catch(() => null);
                setDisplayError(body?.msg ?? `Request failed (${response.status})`);
            } catch {
                setDisplayError('Could not reach the server. Check your connection and try again.');
            }
        }

    return (
        <>
            <div>
                <div className='input-group mb-3'>
                    <span className='input-group-text'>@</span>
                    <input className='form-control' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='your@email.com' />
                </div>
                <div className='input-group mb-3'>
                    <span className='input-group-text'>🔒</span>
                    <input className='form-control' type='password' onChange={(e) => setPassword(e.target.value)} placeholder='password' />
                </div>
                <Button variant='primary' onClick={() => loginUser()} disabled={!userName || !password}>
                    Login
                </Button>
                <Button variant='secondary' onClick={() => createUser()} disabled={!userName || !password}>
                    Create
                </Button>
            </div>

            <MessageDialog message={displayError} onHide={() => setDisplayError(null)} />
        </>
    );
}