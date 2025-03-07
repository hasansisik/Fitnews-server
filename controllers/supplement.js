const Supplement = require("../models/Supplement");
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapePriceFromTrendyol(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const priceText = $(".prc-dsc").first().text().trim();

    if (!priceText) {
      return null; // Return null instead of 0 to indicate scraping failed
    }

    const cleanPrice = priceText.replace("TL", "").trim();
    const [lira, kurus] = cleanPrice.split(",");
    
    if (!lira) {
      return null;
    }

    const liraWithoutDots = lira.replace(/\./g, "");
    const liraAmount = parseInt(liraWithoutDots, 10);
    const kurusAmount = kurus ? parseInt(kurus, 10) : 0;

    if (isNaN(liraAmount)) {
      return null;
    }

    const totalKurus = liraAmount * 100 + kurusAmount;
    return totalKurus / 100;

  } catch (error) {
    console.error(`Error scraping price from ${url}:`, error.message);
    return null;
  }
}

// Create new supplement
exports.createSupplement = async (req, res) => {
  try {
    const supplementData = req.body;

    // Scrape prices for each brand
    for (let brand of supplementData.brands) {
      const scrapedPrice = await scrapePriceFromTrendyol(brand.productLink);
      brand.price = scrapedPrice / brand.scale; // Divide by scale if provided
    }

    // Calculate average price - total price divided by total number of brands
    const totalPrice = supplementData.brands.reduce(
      (sum, brand) => sum + (brand.price || 0),
      0
    );
    supplementData.averagePrice = totalPrice / supplementData.brands.length;

    const supplement = new Supplement(supplementData);
    await supplement.save();
    res.status(201).json(supplement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Modified getAllSupplements to handle errors better
exports.getAllSupplements = async (req, res) => {
  try {
    const supplements = await Supplement.find().populate("brands");
    const updatedSupplements = await Promise.all(
      supplements.map(async (supplement) => {
        const supplementObj = supplement.toObject();
        let priceUpdated = false;

        for (const brand of supplementObj.brands) {
          if (brand.productLink && brand.productLink.includes("trendyol")) {
            const scrapedPrice = await scrapePriceFromTrendyol(brand.productLink);
            // Only update price if scraping was successful
            if (scrapedPrice !== null) {
              brand.price = scrapedPrice / brand.scale;
              priceUpdated = true;
            }
          }
        }

        // Only update in database if any price was successfully updated
        if (priceUpdated) {
          const totalPrice = supplementObj.brands.reduce(
            (sum, brand) => sum + (brand.price || 0),
            0
          );
          const averagePrice = totalPrice / supplementObj.brands.length;
          
          await Supplement.findByIdAndUpdate(supplement._id, {
            brands: supplementObj.brands,
            averagePrice
          });
        }

        return supplementObj;
      })
    );

    res.status(200).json(updatedSupplements);

  } catch (error) {
    console.error("Error updating supplement prices:", error);
    // Return existing data from database if update fails
    const existingSupplements = await Supplement.find().populate("brands");
    res.status(200).json(existingSupplements);
  }
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
        brand.price = scrapedPrice / brand.scale; // Divide by scale if provided
      }

      // Calculate average price - total price divided by total number of brands
      const totalPrice = updateData.brands.reduce(
        (sum, brand) => sum + (brand.price || 0),
        0
      );
      updateData.averagePrice = totalPrice / updateData.brands.length;
    }

    const supplement = await Supplement.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!supplement) {
      return res.status(404).json({ message: "Supplement not found" });
    }

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

    res.status(200).json({ message: "Supplement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
