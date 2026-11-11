'use strict';

const DATA_URL = 'travel_recommendation_api.json';

// Optional task 10: time zone per recommended place.
const TIME_ZONES = {
  'Sydney, Australia': 'Australia/Sydney',
  'Melbourne, Australia': 'Australia/Melbourne',
  'Tokyo, Japan': 'Asia/Tokyo',
  'Kyoto, Japan': 'Asia/Tokyo',
  'Rio de Janeiro, Brazil': 'America/Sao_Paulo',
  'São Paulo, Brazil': 'America/Sao_Paulo',
  'Angkor Wat, Cambodia': 'Asia/Phnom_Penh',
  'Taj Mahal, India': 'Asia/Kolkata',
  'Bora Bora, French Polynesia': 'Pacific/Tahiti',
  'Copacabana Beach, Brazil': 'America/Sao_Paulo'
};

let dataPromise = null;

// Fetch the JSON once and reuse it for every search.
function loadData() {
  if (!dataPromise) {
    dataPromise = fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log('Travel data loaded:', data);
        return data;
      })
      .catch((error) => {
        dataPromise = null; // allow a retry on the next search
        throw error;
      });
  }
  return dataPromise;
}

// Accepts beach/beaches, temple/temples, country/countries in any case,
// or a specific country name such as "japan".
function findRecommendations(data, rawTerm) {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return [];

  if (/^beach(es)?$/.test(term)) return data.beaches;
  if (/^temples?$/.test(term)) return data.temples;
  if (/^countr(y|ies)$/.test(term)) return data.countries.flatMap((country) => country.cities);

  const country = data.countries.find((c) => c.name.toLowerCase() === term);
  return country ? country.cities : [];
}

function localTime(placeName) {
  const timeZone = TIME_ZONES[placeName];
  if (!timeZone) return '';
  return new Date().toLocaleTimeString('en-US', {
    timeZone,
    hour12: true,
    hour: 'numeric',
    minute: 'numeric'
  });
}

function createCard(place) {
  const card = document.createElement('article');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = place.imageUrl;
  img.alt = place.name;
  img.loading = 'lazy';

  const title = document.createElement('h3');
  title.textContent = place.name;

  const description = document.createElement('p');
  description.textContent = place.description;

  card.append(img, title, description);

  const time = localTime(place.name);
  if (time) {
    const timeEl = document.createElement('p');
    timeEl.className = 'local-time';
    timeEl.textContent = `Local time: ${time}`;
    card.append(timeEl);
  }
  return card;
}

function renderResults(container, places, term) {
  container.replaceChildren();

  const heading = document.createElement('h2');
  heading.textContent = 'Search Results';
  container.append(heading);

  if (places.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = `No recommendations found for "${term}". Try beach, temple, or country.`;
    container.append(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  places.forEach((place) => grid.append(createCard(place)));
  container.append(grid);
}

function initSearch() {
  const input = document.getElementById('searchInput');
  const btnSearch = document.getElementById('btnSearch');
  const btnClear = document.getElementById('btnClear');
  const results = document.getElementById('results');
  const intro = document.getElementById('intro');
  if (!input || !btnSearch || !btnClear || !results) return; // not the home page

  loadData().catch((error) => console.error('Could not load travel data:', error));

  btnSearch.addEventListener('click', async () => {
    const term = input.value.trim();
    if (!term) return;
    try {
      const data = await loadData();
      renderResults(results, findRecommendations(data, term), term);
      intro.hidden = true;
    } catch (error) {
      console.error('Search failed:', error);
      results.textContent = 'Sorry, recommendations could not be loaded. Please try again.';
    }
  });

  btnClear.addEventListener('click', () => {
    input.value = '';
    results.replaceChildren();
    intro.hidden = false;
    input.focus();
  });
}

// Contact form: opens the visitor's email app with the message filled in.
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const to = document.getElementById('contactEmail').textContent.trim();
  const status = document.getElementById('formStatus');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();

    const subject = encodeURIComponent(`TravelBloom inquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    status.textContent = 'Thank you! Your email app should open so you can send the message.';
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initContactForm();
});
