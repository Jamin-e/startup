import React from 'react';
import '../app.css';

export function Main() {
    const [search, setSearch] = React.useState([]);
    const [query, setQuery] = React.useState('');
    const [service, setService] = React.useState('');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        try{
        const searchText = localStorage.getItem("search");
        if (searchText) {
            const savedSearches = JSON.parse(searchText);
            if (Array.isArray(savedSearches)) {
                setSearch(savedSearches);
            }
        }
    }catch (error){
        console.error(error);
    }
}, []);

function handleSearch(event){
    event.preventDefault();
    setError('');

    const parts = query.split(',');

    if (parts.length !==2 || !parts[0].trim() || !parts[1].trim()) {
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

    const updatedSearches = [...search, newSearch];

    setSearch(updatedSearches);

    try {
        localStorage.setItem("search", JSON.stringify(updatedSearches));
    } catch (error) {
        console.error(error);
        setError(error);
    }

    setQuery('')
    setService('');
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
                        <option value="" disabled selected hidden>Select an option...</option>
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