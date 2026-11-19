const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// =============================================
// GOOGLE PLACES API SEARCH
// =============================================

app.post("/api/search", async (req, res) => {

  try {

    const { category, country } = req.body;

    if (!category || !country) {

      return res.status(400).json({
        error: "Category and country are required."
      });

    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {

      return res.status(500).json({
        error: "Google Places API key is missing in the backend .env file."
      });

    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key":
            process.env.GOOGLE_PLACES_API_KEY,

          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.types"
        },

        body: JSON.stringify({
          textQuery: `${category} in ${country}`,
          pageSize: 20
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error("Google API error:", data);

      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Google Places API request failed."
      });

    }

    // Return businesses as an array
    res.json(data.places || []);

  } catch (error) {

    console.error("Server error:", error);

    res.status(500).json({
      error: "Unable to fetch businesses."
    });

  }

});


// =============================================
// START SERVER
// =============================================

const PORT = 3000;

app.listen(PORT, () => {

  console.log(
    `Backend running at http://localhost:${PORT}`
  );

});