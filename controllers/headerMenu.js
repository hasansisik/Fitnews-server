const HeaderMenu = require('../models/HeaderMenu');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Menu Item
const createMenuItem = async (req, res) => {
  const { title, urlPath } = req.body;

  // URL benzersizlik kontrolü
  const existingMenu = await HeaderMenu.findOne({ urlPath });
  if (existingMenu) {
    throw new CustomError.BadRequestError('Bu URL zaten kullanılıyor');
  }

  const menuItem = await HeaderMenu.create(req.body);
  res.status(StatusCodes.CREATED).json({ menuItem });
};

// Get All Menu Items
const getAllMenuItems = async (req, res) => {
  const { isActive } = req.query;
  const queryObject = {};

  // Sadece aktif menüleri getir (public endpoint için)
  if (isActive === 'true') {
    queryObject.isActive = true;
  }

  const menuItems = await HeaderMenu.find(queryObject)
    .sort({ order: 1, createdAt: 1 }); // Sıralama önemli: önce order'a göre sonra oluşturma tarihine göre
  
  res.status(StatusCodes.OK).json({ menuItems, count: menuItems.length });
};

// Update Menu Item
const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { urlPath } = req.body;

  // URL değişiyorsa benzersizlik kontrolü yap
  if (urlPath) {
    const existingMenu = await HeaderMenu.findOne({
      _id: { $ne: id },
      urlPath
    });
    if (existingMenu) {
      throw new CustomError.BadRequestError('Bu URL zaten kullanılıyor');
    }
  }

  const menuItem = await HeaderMenu.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!menuItem) {
    throw new CustomError.NotFoundError('Menü öğesi bulunamadı');
  }

  res.status(StatusCodes.OK).json({ menuItem });
};

// Delete Menu Item
const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  const menuItem = await HeaderMenu.findById(id);

  if (!menuItem) {
    throw new CustomError.NotFoundError('Menü öğesi bulunamadı');
  }

  await menuItem.remove();
  res.status(StatusCodes.OK).json({ message: 'Menü öğesi başarıyla silindi' });
};

// Update Menu Orders
const updateMenuOrders = async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    throw new CustomError.BadRequestError('Sıralama listesi bir dizi olmalıdır');
  }

  const updates = items.map(async ({ id, order }) => {
    if (typeof order !== 'number') {
      throw new CustomError.BadRequestError('Sıralama değeri bir sayı olmalıdır');
    }
    
    return HeaderMenu.findByIdAndUpdate(
      id,
      { order },
      { new: true, runValidators: true }
    );
  });

  const updatedItems = await Promise.all(updates);
  res.status(StatusCodes.OK).json({ menuItems: updatedItems });
};

module.exports = {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  updateMenuOrders
};
