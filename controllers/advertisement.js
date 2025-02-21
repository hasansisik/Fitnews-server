const Advertisement = require('../models/Advertisement');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Advertisement
const createAdvertisement = async (req, res) => {
  const { page, type } = req.body;

  // Aynı sayfa ve tipte reklam var mı kontrol et
  const existingAd = await Advertisement.findOne({ page, type });
  if (existingAd) {
    throw new CustomError.BadRequestError('Bu sayfa ve tipte zaten bir reklam var');
  }

  const advertisement = await Advertisement.create(req.body);
  res.status(StatusCodes.CREATED).json({ advertisement });
};

// Get All Advertisements
const getAllAdvertisements = async (req, res) => {
  const advertisements = await Advertisement.find({}).sort('-createdAt');
  res.status(StatusCodes.OK).json({ advertisements, count: advertisements.length });
};

// Get Page Advertisements
const getPageAdvertisements = async (req, res) => {
  const { page } = req.params;
  const advertisements = await Advertisement.find({ page });
  res.status(StatusCodes.OK).json({ advertisements, count: advertisements.length });
};

// Update Advertisement
const updateAdvertisement = async (req, res) => {
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
};

// Delete Advertisement
const deleteAdvertisement = async (req, res) => {
  const { id } = req.params;
  const advertisement = await Advertisement.findById(id);

  if (!advertisement) {
    throw new CustomError.NotFoundError('Reklam bulunamadı');
  }

  await advertisement.remove();
  res.status(StatusCodes.OK).json({ message: 'Reklam başarıyla silindi' });
};

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getPageAdvertisements,
  updateAdvertisement,
  deleteAdvertisement
};
