
import './App.css';
import React, { useState } from 'react';

function App() {
  const [inputCity, setInputCity] = useState('');
  const [inputDistrict, setInputDistrict] = useState('');
  const [inputNeighborhood, setInputNeighborhood] = useState('');
  const [calcCity, setCalcCity] = useState('');
  const [calcDistrictsText, setCalcDistrictsText] = useState('');
  const [distances, setDistances] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputCityChange = (e) => {
    setInputCity(e.target.value);
  };

  const handleInputDistrictChange = (e) => {
    setInputDistrict(e.target.value);
  };

  const handleInputNeighborhoodChange = (e) => {
    setInputNeighborhood(e.target.value);
  };

  const handleCalcCityChange = (e) => {
    setCalcCity(e.target.value);
  };

  const handleCalcDistrictsTextChange = (e) => {
    setCalcDistrictsText(e.target.value);
  };

  const handleCalculateDistance = async () => {
    setIsLoading(true);

    try {
      const inputCoordinates = await fetchCoordinates(inputCity, inputDistrict, inputNeighborhood);

      const districts = calcDistrictsText.split(',').map(district => district.trim());
      const distances = {};
      for (const district of districts) {
        const calcCoordinates = await fetchCoordinates(calcCity, district);
        const distance = await calculateDistance(inputCoordinates, calcCoordinates);
        distances[district] = distance;
      }

      setDistances(distances);
    } catch (error) {
      console.error('Error calculating distance:', error);
      setDistances({});
    }

    setIsLoading(false);
  };

  const fetchCoordinates = async (city, district, neighborhood = '') => {
    const formattedCity = encodeURI(city);
    const formattedDistrict = encodeURI(district);
    const formattedNeighborhood = encodeURI(neighborhood);

    let queryString = `${formattedNeighborhood},${formattedDistrict},${formattedCity}`;
    queryString = queryString.replace(/,/g, ' '); // Replace commas with spaces

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryString}&countrycodes=TR&addressdetails=1&limit=1`);
    if (!response.ok) {
      throw new Error('Failed to fetch coordinates for location');
    }
    const locationData = await response.json();
    const latitude = locationData[0].lat;
    const longitude = locationData[0].lon;
    return [longitude, latitude];
  };

  const calculateDistance = async (inputCoordinates, calcCoordinates) => {
    // const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${inputCoordinates.join(',')};${calcCoordinates.join(',')}`);
    const response = await fetch(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${inputCoordinates.join(',')};${calcCoordinates.join(',')}?overview=false`);

    // https://routing.openstreetmap.de/routed-car/route/v1/driving/32.8801712,39.8793835;31.3503453,40.188822?overview=false&alternatives=true&steps=true

    if (!response.ok) {
      throw new Error('Failed to fetch distance data');
    }
    const data = await response.json();
    const distanceInKm = data.routes[0].distance / 1000; // Distance in meters to kilometers
    return distanceInKm.toFixed(2); // Round to 2 decimal places
  };

  return (
    <div className='wrapper'>
      <h1>Distance Calculator</h1>
      <div>
        <h2>Input Location</h2>
        <label>
          <span>City:</span>
          <input type="text" value={inputCity} onChange={handleInputCityChange} />
        </label>
        <br />
        <label>
          <span>District:</span>
          <input type="text" value={inputDistrict} onChange={handleInputDistrictChange} />
        </label>
        <br />
        <label>
          <span>Neighborhood:</span>
          <input type="text" value={inputNeighborhood} onChange={handleInputNeighborhoodChange} />
        </label>
      </div>
      <div>
        <h2>Calculation Location</h2>
        <label>
          <span>City:</span>
          <input type="text" value={calcCity} onChange={handleCalcCityChange} />
        </label>
        <br />
        <label>
          <span>Districts (Comma separated):</span>
          <textarea rows="4" cols="22" value={calcDistrictsText} onChange={handleCalcDistrictsTextChange} />
        </label>
      </div>
      <button onClick={handleCalculateDistance} disabled={!inputCity || !inputDistrict || !inputNeighborhood || !calcCity || calcDistrictsText.trim() === '' || isLoading}>
        Calculate Distance
      </button>
      <div>
        {isLoading ? (
          <p>Loading...</p>
        ) : Object.keys(distances).length > 0 ? (
          <div>
            <h2>Results</h2>
            <table border="1">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Distance (km)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(distances).map(([district, distance]) => (
                  <tr key={district}>
                    <td>{district}</td>
                    <td>{distance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No distances calculated</p>
        )}
      </div>
    </div>
  );
}

export default App;
