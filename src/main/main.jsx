import React from 'react';
import '../app.css';

export function Main() {
    const [search, setSearch] = React.useState([]);

    React.useEffect(() => {
        const searchText = localStorage.getItem("search",);
        if (searchText) {
            setSearch(JSON.parse(searchText));
        }
    }, []);

    const searchRows = [];
    if (search.length) {
        for (const [i, search] of search.entries()){
            searchRows.push(
                <tr key={i}>
                    <td>{i}</td>
                    <td>{search.service}</td>
                    <td>{search.state}</td>
                    <td>{search.city}</td>
                    <td>{search.population}</td>
                    <td>{search.heat}</td>
                    <td>{search.oldData}</td>
                </tr>
            );
        }
    } else {
        searchRows.push(
            <tr key = '0'>
        <td colSpan='7'> No results found.</td>
        </tr>
        );
    }


    return (
        <main>
            <section id="search">
                <p>To be implemented: A search that changes the map to location and changes map type</p>
                <form role="search" action="/search" method="get" className="search-form">
                    <label htmlFor="query">City and State</label>
                    <input
                        type="text"
                        name="query"
                        id="query"
                        placeholder="City, State"
                        aria-label="City, State"
                    />
                    <label htmlFor="service-select">Choose a service</label>
                    <select name="service" id="service-select" required>
                        <option value="" disabled selected hidden>Select an option...</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="dentistry">Dentistry</option>
                    </select>
                    <button type="submit">Search</button>
                </form>
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

                    <tbody id = "searches"></tbody>
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