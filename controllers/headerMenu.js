const HeaderMenu = require('../models/HeaderMenu');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create Menu Item
const createMenuItem = async (req, res) => {
  try {
    const { title, urlPath, subTitles } = req.body;

    // URL benzersizlik kontrolü
    const existingMenu = await HeaderMenu.findOne({ urlPath });
    if (existingMenu) {
      throw new CustomError.BadRequestError('Bu URL zaten kullanılıyor');
    }

    // Alt başlıkların URL'lerini ana URL ile birleştir
    const processedSubTitles = subTitles.map(sub => ({
      ...sub,
      urlPath: `${urlPath}${sub.urlPath}`
    }));

    const menuItem = await HeaderMenu.create({ title, urlPath, subTitles: processedSubTitles });
    res.status(StatusCodes.CREATED).json({ menuItem });
  } catch (error) {
    if (error instanceof CustomError.BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    } else {
      console.error('Create Menu Item Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Menü öğesi oluşturulurken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Get All Menu Items
const getAllMenuItems = async (req, res) => {
  try {
    const { isActive } = req.query;
    const queryObject = {};

    // Sadece aktif menüleri getir (public endpoint için)
    if (isActive === 'true') {
      queryObject.isActive = true;
    }

    const menuItems = await HeaderMenu.find(queryObject)
      .sort({ order: 1, createdAt: 1 })
      .populate('subTitles'); // Alt menüleri de getir
    
    res.status(StatusCodes.OK).json({ menuItems, count: menuItems.length });
  } catch (error) {
    console.error('Get All Menu Items Error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Menü öğeleri getirilirken bir hata oluştu',
      error: error.message 
    });
  }
};

// Update Menu Item
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { urlPath, subTitles } = req.body;

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

    // Alt başlıkların URL'lerini ana URL ile birleştir
    const processedSubTitles = subTitles.map(sub => ({
      ...sub,
      urlPath: `${urlPath}${sub.urlPath}`
    }));

    const menuItem = await HeaderMenu.findByIdAndUpdate(
      id,
      { urlPath, subTitles: processedSubTitles },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      throw new CustomError.NotFoundError('Menü öğesi bulunamadı');
    }

    res.status(StatusCodes.OK).json({ menuItem });
  } catch (error) {
    if (error instanceof CustomError.BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    } else if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else {
      console.error('Update Menu Item Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Menü öğesi güncellenirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Delete Menu Item
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await HeaderMenu.findByIdAndDelete(id);

    if (!menuItem) {
      throw new CustomError.NotFoundError('Menü öğesi bulunamadı');
    }

    res.status(StatusCodes.OK).json({ msg: 'Menü öğesi başarıyla silindi' });
  } catch (error) {
    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ msg: error.message });
    } else {
      console.error('Delete Menu Item Error:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Menü öğesi silinirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

// Update Menu Orders
const updateMenuOrders = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      throw new CustomError.BadRequestError('Geçersiz veri formatı');
    }

    // Tüm güncellemeleri bir transaction içinde yap
    const updates = items.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } }
      }
    }));

    await HeaderMenu.bulkWrite(updates);

    const updatedMenuItems = await HeaderMenu.find({
      _id: { $in: items.map(item => item.id) }
    }).sort({ order: 1 });

    res.status(StatusCodes.OK).json({ menuItems: updatedMenuItems });
  } catch (error) {
    if (error instanceof CustomError.BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({ msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
        msg: 'Menü sıralaması güncellenirken bir hata oluştu',
        error: error.message 
      });
    }
  }
};

module.exports = {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  updateMenuOrders
};
