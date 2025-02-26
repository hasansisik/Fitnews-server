const Advertisement = require('../models/Advertisement');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Advertisement
const createAdvertisement = async (req, res) => {
  try {
    const { page, type, link } = req.body;

    // Aynı sayfa ve tipte reklam var mı kontrol et
    const existingAd = await Advertisement.findOne({ page, type });
    if (existingAd) {
      throw new CustomError.BadRequestError('Bu sayfa ve tipte zaten bir reklam var');
    }

    const advertisement = await Advertisement.create(req.body);
    res.status(StatusCodes.CREATED).json({ advertisement });
  } catch (error) {
    console.error('Create Advertisement Error:', error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

// Get All Advertisements
const getAllAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find({}).sort('-createdAt');
    res.status(StatusCodes.OK).json({ advertisements, count: advertisements.length });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

// Get Page Advertisements
const getPageAdvertisements = async (req, res) => {
  try {
    const { page } = req.params;
    const advertisements = await Advertisement.find({ page });
    res.status(StatusCodes.OK).json({ advertisements, count: advertisements.length });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

// Update Advertisement
const updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, type } = req.body;

    // Eğer sayfa veya tip değişiyorsa, çakışma kontrolü yap
    if (page || type) {
      const existingAd = await Advertisement.findOne({
        _id: { $ne: id }, // kendisi hariç
        page: page || (await Advertisement.findById(id)).page,
        type: type || (await Advertisement.findById(id)).type
      });

      if (existingAd) {
        throw new CustomError.BadRequestError('Bu sayfa ve tipte zaten bir reklam var');
      }
    }

    const advertisement = await Advertisement.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!advertisement) {
      throw new CustomError.NotFoundError('Reklam bulunamadı');
    }

    res.status(StatusCodes.OK).json({ advertisement });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

// Delete Advertisement
const deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      throw new CustomError.NotFoundError('Reklam bulunamadı');
    }

    await advertisement.remove();
    res.status(StatusCodes.OK).json({ message: 'Reklam başarıyla silindi' });
  } catch (error) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getPageAdvertisements,
  updateAdvertisement,
  deleteAdvertisement
};
