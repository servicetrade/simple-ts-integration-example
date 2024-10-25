// Load required modules
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.TS_SECRET || process.env.TS_SECRET == "secret") {
	console.error("ERROR: ThoughtSpot Secret Missing from env file. See README.txt");
	process.exit();
}

// Initialize the Express app
const app = express();
const PORT = 3000;


// Serve static HTML file
app.get('/', (req, res) => {
	res.send(`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>ThoughtSpot Embed</title>
				<script type="module">
					import { init, AuthType, AppEmbed, Page } from 'https://cdn.jsdelivr.net/npm/@thoughtspot/visual-embed-sdk/dist/tsembed.es.js';

					// Initialize ThoughtSpot SDK with Trusted Auth Token
					async function initThoughtSpot() {
						const response = await fetch('/authtoken');
						const token = await response.text();

						init({
							thoughtSpotHost: 'https://servicetrade-dev.thoughtspot.cloud/',
							authType: AuthType.TrustedAuthToken,
							getAuthToken: () => token,
						});

						const embed = new AppEmbed('#embed', {
							frameParams: { height: '600px', width: '100%' },
							pageId: Page.Liveboards
						});

						embed.render();
					}

					// Initialize the ThoughtSpot embed on page load
					window.onload = initThoughtSpot;
				</script>
			</head>
			<body>
				<h1>ThoughtSpot Trusted Auth Example</h1>
				<div id="embed"></div>
			</body>
		</html>
	`);
});

// API endpoint to return a static auth token
app.get('/authtoken', async (req, res) => {
	const payload = {
		username: process.env.TS_USERNAME,
		validity_time_in_sec: 300,
		auto_create: false,
		secret_key: process.env.TS_SECRET,
	};

	try {
		const response = await fetch(`${process.env.TS_HOST}/api/rest/2.0/auth/token/full`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch token: ${response.statusText}`);
		}

		const data = await response.json();
		res.send(data.token);
	} catch (error) {
		console.error('Error fetching token:', error.message);
		res.status(500).send(null);
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

