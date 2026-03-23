// ===== script.js — Crypto Dashboard =====

// API URL — fetches top coins in USD
const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd";

// This variable will hold all the coin data we get from the API
let allCoins = [];

// Grab references to HTML elements we need
const coinsContainer = document.getElementById("coinsContainer");
const loadingMsg = document.getElementById("loadingMsg");

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

// ─── Search Functionality ──────────────────────────────

const searchInput = document.getElementById("searchInput");

// Listen for every keystroke in the search box
searchInput.addEventListener("input", function () {
  // Get what the user typed, in lowercase
  const searchTerm = searchInput.value.toLowerCase();

  // Use filter() to keep only coins whose name or symbol matches
  const filtered = allCoins.filter((coin) => {
    return (
      coin.name.toLowerCase().includes(searchTerm) ||
      coin.symbol.toLowerCase().includes(searchTerm)
    );
  });

  // Re-render with only the matching coins
  displayCoins(filtered);
});
