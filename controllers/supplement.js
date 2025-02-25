const Supplement = require('../models/Supplement');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to scrape price from Trendyol
async function scrapePriceFromTrendyol(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const priceText = $('.prc-dsc').first().text();
        const price = parseFloat(priceText.replace('TL', '').replace(',', '.').trim());
        return price || 0;
    } catch (error) {
        console.error(`Error scraping price from ${url}:`, error.message);
        return 0;
    }
}

// Create new supplement
exports.createSupplement = async (req, res) => {
    try {
        const supplementData = req.body;
        
        // Scrape prices for each brand
        for (let brand of supplementData.brands) {
            const scrapedPrice = await scrapePriceFromTrendyol(brand.productLink);
            brand.price = scrapedPrice;
        }

        // Calculate average price
        const validPrices = supplementData.brands.filter(brand => brand.price > 0);
        if (validPrices.length > 0) {
            const totalPrice = validPrices.reduce((sum, brand) => sum + brand.price, 0);
            supplementData.averagePrice = totalPrice / validPrices.length;
        }

        const supplement = new Supplement(supplementData);
        await supplement.save();
        res.status(201).json(supplement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all supplements with updated prices
exports.getAllSupplements = async (req, res) => {
    try {
        const supplements = await Supplement.find();
        
        // Update prices for each supplement
        for (let supplement of supplements) {
            let totalPrice = 0;
            let validPrices = 0;

            // Scrape new prices from each brand's link
            for (let brand of supplement.brands) {
                const newPrice = await scrapePriceFromTrendyol(brand.productLink);
                if (newPrice > 0) {
                    brand.price = newPrice;
                    totalPrice += newPrice;
                    validPrices++;
                }
            }

            // Update average price if we have valid prices
            if (validPrices > 0) {
                supplement.averagePrice = totalPrice / validPrices;
                await supplement.save();
            }
        }

        res.status(200).json(supplements);
    } catch (error) {
        res.status(500).json({ message: error.message });
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