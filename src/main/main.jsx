import React from 'react';
import '../app.css';

export function Main() {
    const [search, setSearch] = React.useState([]);
    const [query, setQuery] = React.useState('');
    const [service, setService] = React.useState('');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        let cancelled = false;

        async function loadSearches() {
            try {
                const response = await fetch('/api/searches', {
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error(
                        response.status === 401
                            ? 'Please log in to view saved searches.'
                            : `Could not load searches (${response.status}).`
                    );
                }

                const savedSearches = await response.json();

                if (!Array.isArray(savedSearches)) {
                    throw new Error('The server returned an invalid search list.');
                }

                if (!cancelled) {
                    setSearch(savedSearches);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(error.message || 'Could not load searches.');
                }
            }
        }

        loadSearches()

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSearch(event) {
        event.preventDefault();
        setError('');

        const parts = query.split(',');

        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
            setError('Enter a city and state');
            return;
        }

        const city = parts[0].trim();
        const state = parts[1].trim();

        const newSearch = {
            service: service,
            state: state,
            city: city,
            population: 100,
            heat: 1.15,
            oldData: new Date().toLocaleDateString()
        };

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'same-origin',
                body: JSON.stringify(newSearch),
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Please log in again before saving a search.'
                        : `Search failed (${response.status}).`
                );
            }

            const updatedSearches = await response.json();
            setSearch(updatedSearches);
            setQuery('');
            setService('');
        } catch (error) {
            setError(error.message || 'Could not reach the server.');
        }
}


    return (
        <main>
            <section id="search">
                <p>To be implemented: A search that changes the map to location and changes map type</p>
                <form role="search" onSubmit={handleSearch} className="search-form">
                    <label htmlFor="query">City and State</label>
                    <input
                        type="text"
                        name="query"
                        id="query"
                        placeholder="City, State"
                        aria-label="City, State"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        required
                    />
                    <label htmlFor="service-select">Choose a service</label>
                    <select name="service" id="service-select" value={service} onChange={(event) => setService(event.target.value)} required>
                        <option defaultValue="" disabled hidden>Select an option...</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="dentistry">Dentistry</option>
                    </select>
                    <button type="submit">Search</button>
                </form>

                {error && <p role={"alert"}>{error}</p>}
            </section>

            <section id="savedSearches">
                <p>To be implemented: a table that stores the data of previous searches</p>
                <h2>Saved searches</h2>
                <table>
                    <thead>
                    <tr>
                        <th>Search #</th>
                        <th>Service</th>
                        <th>State</th>
                        <th>City</th>
                        <th>Population</th>
                        <th>Heat</th>
                        <th>Oldest data</th>
                    </tr>
                    </thead>

                    <tbody id = "search-results">
                    {search.length > 0 ? (
                        search.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.service}</td>
                                <td>{item.state}</td>
                                <td>{item.city}</td>
                                <td>{item.population.toLocaleString()}</td>
                                <td>{item.heat}</td>
                                <td>{item.oldData}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">No results found.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </section>

            <section id="map">
                <p>To be implemented: interactive map that uses websockets due to large amounts of different types of
                    data that changes as they interact with the map plus data updates as they come</p>
                <img alt = "temp image" src="../../public/Utah_population_map.png"/>
                <p>image found at Wikipedia commons: https://commons.wikimedia.org/wiki/File:Utah_population_map.png</p>
            </section>


        </main>
    );
}