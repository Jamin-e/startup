import React from 'react';
import '../app.css'

export function Auth() {
    return (
        <main>
            <section id="auth-section">
                <h2>Create account or login</h2>
                <form id="auth-form">
                    <label htmlFor="username">Username</label>
                    <input id="username" name="username" type="text" autoComplete="username" required/>
                    <button type="submit">Continue</button>
                </form>
                <p id="login-message" hidden></p>
            </section>
        </main>
    );
}