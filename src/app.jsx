import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Auth } from './auth/auth';
import { Main } from './main/main';

export default function App() {
    return (
        <BrowserRouter>
        <div className="body bg-dark text-light">
            <header className="container-fluid">
                <nav className="navbar fixed-top navbar-dark">
                    <div className="navbar-brand">
                        Startup<sup>&reg;</sup>
                    </div>
                    <menu className="navbar-nav">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="">
                                Home
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="auth">
                                Login
                            </NavLink>
                        </li>
                    </menu>
                </nav>
            </header>

            <Routes>
                <Route path='/' element={<Main/>} exact />
                <Route path='/auth' element={<Auth/>} />
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