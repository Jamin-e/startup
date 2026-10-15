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

            <Routess>
                <Route path='/' element={<Main/>} exact />
                <Route path='/auth' element={<Auth/>} />
                <Route path='*' element={<NotFound />} />
            </Routess>

            <footer className="bg-dark text-white-50">
                <div className="container-fluid">
                    <span className="text-reset">Author Name(s)</span>
                    <a className="text-reset" href="https://github.com/webprogramming260/simon-react">
                        Source
                    </a>
                </div>
            </footer>
        </div>
        </BrowserRouter>
    );
}
function NotFound() {
    return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}