// ===== script.js — Crypto Dashboard =====

// ─── Debounce: delays execution until user stops typing ─
// If called again within 'delay' ms, the timer resets
function debounce(func, delay) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => func.apply(this, args), delay);
  };
}

// ─── Throttle: limits how often a function can run ──────
// Once called, the function won't fire again for 'limit' ms
function throttle(func, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// API URL — fetches top coins in USD
const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";

// This variable will hold all the coin data we get from the API
let allCoins = [];

// Grab references to HTML elements we need
const coinsContainer = document.getElementById("coinsContainer");
const loadingMsg = document.getElementById("loadingMsg");

// ─── Favorites using localStorage ──────────────────────

// Load saved favorites from localStorage (or start with empty array)
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function isFav(coinId) {
  return favorites.includes(coinId);
}

function toggleFavorite(coinId) {
  if (isFav(coinId)) {
    // Remove from favorites
    favorites = favorites.filter((id) => id !== coinId);
  } else {
    // Add to favorites
    favorites.push(coinId);
  }
  // Save updated list to localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));
  // Re-render to update the star
  applyFilters();
}

// ─── Fetch Data from API ───────────────────────────────

async function fetchCoins() {
  // Show loading message while we wait
  loadingMsg.style.display = "block";
  coinsContainer.innerHTML = "";

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // Save data so we can search/filter/sort later
    allCoins = data;

    // Render the coins on screen
    displayCoins(allCoins);
  } catch (error) {
    coinsContainer.innerHTML = "<p>⚠️ Failed to load data. Try again later.</p>";
    console.error("Fetch error:", error);
  } finally {
    // Hide loading message whether it worked or not
    loadingMsg.style.display = "none";
  }
}

// ─── Display Coins using map() ─────────────────────────

function displayCoins(coins) {
  // Use map() to turn each coin object into an HTML card string
  const cardsHTML = coins
    .map((coin) => {
      // Some coins return null for these fields, so use 0 as fallback
      const change = coin.price_change_percentage_24h ?? 0;
      const price = coin.current_price ?? 0;
      const marketCap = coin.market_cap ?? 0;

      // Decide color based on 24h price change
      const changeClass = change >= 0 ? "green" : "red";
      const changeSymbol = change >= 0 ? "▲" : "▼";

      return `
        <div class="coin-card">
          <button class="fav-btn ${isFav(coin.id) ? "favorited" : ""}" onclick="toggleFavorite('${coin.id}')">
            ${isFav(coin.id) ? "⭐" : "☆"}
          </button>
          <img src="${coin.image}" alt="${coin.name}">
          <h3>${coin.name}</h3>
          <p class="symbol">${coin.symbol}</p>
          <p class="price">$${price.toLocaleString()}</p>
          <p class="market-cap">MCap: $${marketCap.toLocaleString()}</p>
          <p class="change ${changeClass}">
            ${changeSymbol} ${change.toFixed(2)}%
          </p>
        </div>
      `;
    })
    .join(""); // join all card strings into one big HTML string

  coinsContainer.innerHTML = cardsHTML;
}

// ─── Start the app ─────────────────────────────────────

fetchCoins();

// ─── Grab references to controls ───────────────────────

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const btnAll = document.getElementById("btnAll");
const btnGainers = document.getElementById("btnGainers");
const btnLosers = document.getElementById("btnLosers");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

// Track which filter button is active: "all", "gainers", or "losers"
let currentFilter = "all";

// ─── Pagination state ──────────────────────────────────
const COINS_PER_PAGE = 10;
let currentPage = 1;
let filteredCoins = []; // stored so pagination can access it

// ─── Central function: apply search + filter + sort ────

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();

  // Step 1: SEARCH — filter by name or symbol
  let result = allCoins.filter((coin) => {
    return (
      coin.name.toLowerCase().includes(searchTerm) ||
      coin.symbol.toLowerCase().includes(searchTerm)
    );
  });

  // Step 2: FILTER — gainers or losers
  if (currentFilter === "gainers") {
    result = result.filter((coin) => (coin.price_change_percentage_24h ?? 0) > 0);
  } else if (currentFilter === "losers") {
    result = result.filter((coin) => (coin.price_change_percentage_24h ?? 0) < 0);
  }

  // Step 3: SORT — reorder based on dropdown selection
  const sortValue = sortSelect.value;

  result.sort((a, b) => {
    if (sortValue === "price_asc") return (a.current_price ?? 0) - (b.current_price ?? 0);
    if (sortValue === "price_desc") return (b.current_price ?? 0) - (a.current_price ?? 0);
    if (sortValue === "market_cap_asc") return (a.market_cap ?? 0) - (b.market_cap ?? 0);
    if (sortValue === "market_cap_desc") return (b.market_cap ?? 0) - (a.market_cap ?? 0);
    if (sortValue === "name_asc") return a.name.localeCompare(b.name);
    if (sortValue === "name_desc") return b.name.localeCompare(a.name);
    return 0;
  });

  // Step 4: Store results + reset to page 1
  filteredCoins = result;
  currentPage = 1;
  renderPage();
}

// ─── Pagination: render a specific page of coins ────────

function renderPage() {
  const totalPages = Math.max(1, Math.ceil(filteredCoins.length / COINS_PER_PAGE));

  // Clamp currentPage
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  // Slice the coins for this page
  const start = (currentPage - 1) * COINS_PER_PAGE;
  const pageCoins = filteredCoins.slice(start, start + COINS_PER_PAGE);

  displayCoins(pageCoins);

  // Update page info text
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  // Disable/enable buttons at boundaries
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

// ─── Helper: set active button styling ─────────────────

function setActiveButton(activeBtn) {
  // Remove "active" class from all buttons
  btnAll.classList.remove("active");
  btnGainers.classList.remove("active");
  btnLosers.classList.remove("active");

  // Add "active" class to the clicked button
  activeBtn.classList.add("active");
}

// ─── Event Listeners ───────────────────────────────────

// Debounce search — waits 300ms after user stops typing
const debouncedFilter = debounce(applyFilters, 300);
searchInput.addEventListener("input", debouncedFilter);

sortSelect.addEventListener("change", applyFilters);

// Throttle button clicks — max once per 300ms
const throttledApply = throttle(applyFilters, 300);

btnAll.addEventListener("click", function () {
  currentFilter = "all";
  setActiveButton(btnAll);
  throttledApply();
});

btnGainers.addEventListener("click", function () {
  currentFilter = "gainers";
  setActiveButton(btnGainers);
  throttledApply();
});

btnLosers.addEventListener("click", function () {
  currentFilter = "losers";
  setActiveButton(btnLosers);
  throttledApply();
});

// Pagination buttons
prevPageBtn.addEventListener("click", function () {
  currentPage--;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

nextPageBtn.addEventListener("click", function () {
  currentPage++;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ─── Dark Mode Toggle ──────────────────────────────────

const darkModeToggle = document.getElementById("darkModeToggle");

// Check if user previously chose dark mode
if (localStorage.getItem("darkMode") === "on") {
  document.body.classList.add("dark");
  darkModeToggle.textContent = "☀️ Light Mode";
}

darkModeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("darkMode", "on");
    darkModeToggle.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("darkMode", "off");
    darkModeToggle.textContent = "🌙 Dark Mode";
  }
});
