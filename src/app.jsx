import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './auth/login';
import { Main } from './main/main';
import { AuthState } from "./auth/authState";

export default function App() {
    const [userName, setUserName] = React.useState('');
    const [authState, setAuthState] = React.useState(AuthState.Unknown);

    React.useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/me', { credentials: 'same-origin' })
            .then(async (response) => {
                if (!response.ok) throw new Error('No active session');
                return response.json();
            })
            .then(({ email }) => {
                if (!cancelled) {
                    setUserName(email);
                    setAuthState(AuthState.Authenticated);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    localStorage.removeItem('userName');
                    setUserName('');
                    setAuthState(AuthState.Unauthenticated);
                }
            });
        return () => { cancelled = true; };
    }, []);

    return (
        <BrowserRouter>
        <div className="body bg-dark text-light">
            <header className="container-fluid">
                <nav className="navbar fixed-top navbar-dark">
                    <div className="navbar-brand">
                        Invisible hand<sup>&reg;</sup>
                    </div>
                    <menu className="navbar-nav">
                        {authState === AuthState.Authenticated && (
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/main">
                                Home
                            </NavLink>
                        </li>
                        )}
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">
                                Login
                            </NavLink>
                        </li>
                    </menu>
                </nav>
            </header>

            <Routes>
                <Route
                    path='/'
                    element={
                        <Login
                            userName={userName}
                            authState={authState}
                            onAuthChange={(userName, authState) => {
                                setAuthState(authState);
                                setUserName(userName);
                            }}
                        />
                    }
                />
                <Route
                    path={'/main'}
                    element={
                        authState === AuthState.Unknown ? null :
                            authState === AuthState.Authenticated ? <Main userName={userName} /> :
                                <Navigate to="/" replace />
                    }
                />
                <Route path='*' element={<NotFound />} />
            </Routes>

            <footer>
                <a href="https://github.com/Jamin-e/startup">Jamin | Github</a>
                <p>About:</p>
                <p>This is a datascience site to show where businesses and services are most needed. This is a heatmap that starts as a population map, where heat is lowered based on local services and their estimated capacity.</p>
            </footer>
        </div>
        </BrowserRouter>
    );
}
function NotFound() {
    return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}
