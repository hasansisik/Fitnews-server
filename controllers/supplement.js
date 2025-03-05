const Supplement = require("../models/Supplement");
const axios = require("axios");
const cheerio = require("cheerio");

// Helper function to scrape price from Trendyol
async function scrapePriceFromTrendyol(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const $ = cheerio.load(response.data);
    const priceText = $(".prc-dsc").first().text().trim();
    
    if (!priceText) {
      console.warn(`No price found for URL: ${url}`);
      return 0;
    }
    
    // Remove 'TL' and any extra spaces
    const cleanPrice = priceText.replace("TL", "").trim();
    
    // Split by comma to separate TL and kuruş
    const [lira, kurus] = cleanPrice.split(",");
    
    if (!lira) {
      console.warn(`Invalid price format for URL: ${url}`);
      return 0;
    }
    
    // Remove dots from lira part (e.g., "1.240" becomes "1240")
    const liraWithoutDots = lira.replace(/\./g, "");
    
    // Convert to number
    const liraAmount = parseInt(liraWithoutDots, 10);
    const kurusAmount = kurus ? parseInt(kurus, 10) : 0;
    
    if (isNaN(liraAmount)) {
      console.warn(`Failed to parse lira amount for URL: ${url}`);
      return 0;
    }
    
    // Calculate total price in kuruş (1 TL = 100 kuruş)
    const totalKurus = (liraAmount * 100) + kurusAmount;
    const finalPrice = totalKurus / 100;
    
    return isNaN(finalPrice) ? 0 : finalPrice; // Ensure we never return NaN
  } catch (error) {
    console.error(`Error scraping price from ${url}:`, error.message);
    return 0;
  }
}

// Cache for supplements data
let supplementsCache = {
  data: null,
  timestamp: null,
  TTL: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Create new supplement
exports.createSupplement = async (req, res) => {
  try {
    const supplementData = req.body;
    console.log("Creating new supplement:", supplementData);

    // Scrape prices for each brand
    for (let brand of supplementData.brands) {
      const scrapedPrice = await scrapePriceFromTrendyol(brand.productLink);
      brand.price = scrapedPrice / (brand.scale || 1); // Divide by scale if provided
    }

    // Calculate average price - total price divided by total number of brands
    const totalPrice = supplementData.brands.reduce((sum, brand) => sum + (brand.price || 0), 0);
    supplementData.averagePrice = totalPrice / supplementData.brands.length;

    const supplement = new Supplement(supplementData);
    await supplement.save();
    res.status(201).json(supplement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all supplements with updated prices
exports.getAllSupplements = async (req, res) => {
  // Check if we have valid cached data
  if (
    supplementsCache.data &&
    supplementsCache.timestamp &&
    Date.now() - supplementsCache.timestamp < supplementsCache.TTL
  ) {
    return res.status(200).json(supplementsCache.data); // Change 304 to 200
  }

  // If no cache or expired, fetch fresh data
  Supplement.find()
    .then(async (supplements) => {
      try {
        // Update prices in parallel
        const updatedSupplements = await Promise.all(
          supplements.map(async (supplement) => {
            const supplementObj = supplement.toObject();
            const updatedBrands = await Promise.all(
              supplementObj.brands.map(async (brand) => {
                if (brand.productLink && brand.productLink.includes("trendyol")) {
                  const currentPrice = await scrapePriceFromTrendyol(brand.productLink);
                  return { ...brand, price: currentPrice || brand.price };
                }
                return brand;
              })
            );
            return { ...supplementObj, brands: updatedBrands };
          })
        );

        // Update cache
        supplementsCache.data = updatedSupplements;
        supplementsCache.timestamp = Date.now();

        res.status(200).json(updatedSupplements); // Ensure 200 status code
      } catch (error) {
        console.error("Error updating supplement prices:", error);
        res.status(500).json(supplements); // Ensure 500 status code on error
      }
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
};

// Get supplement by type
exports.getSupplementsByType = async (req, res) => {
  try {
    const supplements = await Supplement.find({ type: req.params.type });
    res.status(200).json(supplements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update supplement
exports.updateSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Scrape prices for each brand if brands are being updated
    if (updateData.brands) {
      for (let brand of updateData.brands) {
        const scrapedPrice = await scrapePriceFromTrendyol(brand.productLink);
        brand.price = scrapedPrice / (brand.scale || 1); // Divide by scale if provided
      }

      // Calculate average price - total price divided by total number of brands
      const totalPrice = updateData.brands.reduce((sum, brand) => sum + (brand.price || 0), 0);
      updateData.averagePrice = totalPrice / updateData.brands.length;
    }

    const supplement = await Supplement.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!supplement) {
      return res.status(404).json({ message: "Supplement not found" });
    }

    // Clear cache after update
    supplementsCache.data = null;
    supplementsCache.timestamp = null;
    
    res.status(200).json(supplement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete supplement
exports.deleteSupplement = async (req, res) => {
  try {
    const { id } = req.params;
    const supplement = await Supplement.findByIdAndDelete(id);
    
    if (!supplement) {
      return res.status(404).json({ message: "Supplement not found" });
    }

    // Clear cache after delete
    supplementsCache.data = null;
    supplementsCache.timestamp = null;
    
    res.status(200).json({ message: "Supplement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
