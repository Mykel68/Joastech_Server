const axios = require("axios");

async function getCryptoPrices() {
  try {
    // Define the cryptocurrencies you're interested in
    const cryptocurrencies = ["bitcoin", "ethereum", "litecoin"]; // Add more as needed

    // Define the currency in which you want the prices (e.g., usd, eur)
    const vsCurrency = "usd";

    // Define the CoinGecko API endpoint
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrencies.join(
      ","
    )}&vs_currencies=${vsCurrency}`;

    // Make the API request
    const response = await axios.get(apiUrl);

    // Check if the request was successful
    if (response.status === 200) {
      const data = response.data;

      // Print the current prices
      cryptocurrencies.forEach((crypto) => {
        const price = data[crypto][vsCurrency];
        console.log(
          `${crypto.charAt(0).toUpperCase() + crypto.slice(1)}: $${price}`
        );
      });
    } else {
      console.error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Call the function to get cryptocurrency prices
getCryptoPrices();
