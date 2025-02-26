const Footer = require('../models/Footer');

// Initialize footer with default values
const initializeFooter = async (req, res) => {
  try {
    // Check if footer already exists
    const existingFooter = await Footer.findOne();
    if (existingFooter) {
      return res.status(400).json({ message: "Footer already exists" });
    }

    // Create initial footer with default values
    const footer = await Footer.create({
      aboutUs: "Default About Us Text",
      copyright: " 2025 Your Company Name. All rights reserved.",
      cookiePolicy: {
        title: "Cookie Policy",
        content: "<p>Default cookie policy content</p>"
      },
      kvk: {
        title: "KVK Aydınlatma Metni",
        content: "<p>Default KVK content</p>"
      },
      forms: []
    });

    res.status(201).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get footer data
const getFooter = async (req, res) => {
  try {
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({
        cookiePolicy: {
          title: "Cookie Policy",
          content: "<p>Default cookie policy content</p>"
        },
        kvk: {
          title: "KVK Aydınlatma Metni",
          content: "<p>Default KVK content</p>"
        }
      });
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update aboutUs
const updateAboutUs = async (req, res) => {
  try {
    const { aboutUs } = req.body;
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({ aboutUs });
    } else {
      footer.aboutUs = aboutUs;
      await footer.save();
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update copyright
const updateCopyright = async (req, res) => {
  try {
    const { copyright } = req.body;
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({ copyright });
    } else {
      footer.copyright = copyright;
      await footer.save();
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update cookie policy
const updateCookiePolicy = async (req, res) => {
  try {
    const { title, content } = req.body;
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({ cookiePolicy: { title, content } });
    } else {
      footer.cookiePolicy = { title, content };
      await footer.save();
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update KVK
const updateKvk = async (req, res) => {
  try {
    const { title, content } = req.body;
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({ kvk: { title, content } });
    } else {
      footer.kvk = { title, content };
      await footer.save();
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add form submission
const addFormSubmission = async (req, res) => {
  try {
    const { email, message } = req.body;
    let footer = await Footer.findOne();
    if (!footer) {
      footer = await Footer.create({ forms: [{ email, message }] });
    } else {
      footer.forms.push({ email, message });
      await footer.save();
    }
    res.status(200).json(footer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFooter,
  updateAboutUs,
  updateCopyright,
  updateCookiePolicy,
  updateKvk,
  addFormSubmission,
  initializeFooter
};
