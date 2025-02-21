const User = require("../models/User");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { sendResetPasswordEmail, sendVerificationEmail } = require("../helpers");
const { generateToken } = require("../services/token.service");

//Email
const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  const user = await User.findOne({ email }).select('auth');

  if (!user) {
    return res.status(400).json({ message: "Kullanıcı bulunamadı." });
  }

  if (user.auth.verificationCode !== verificationCode) {
    return res.status(400).json({ message: "Doğrulama kodu yanlış." });
  }

  user.isVerified = true;
  user.auth.verificationCode = undefined;
  await user.save();

  res.json({ message: "Hesap başarıyla doğrulandı." });
};

//Again Email
const againEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  user.auth.verificationCode = verificationCode;
  await user.save();

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationCode: verificationCode,
  });
  res.json({ message: "Doğrulama kodu Gönderildi" });
};

//Register
const register = async (req, res, next) => {
  try {
    const { name, email, password, picture } = req.body;

    //check email
    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
      throw new CustomError.BadRequestError("Bu e-posta adresi zaten kayıtlı.");
    }

    //token create
    const verificationCode = Math.floor(1000 + Math.random() * 9000);

    const user = new User({
      name,
      email,
      profile: { picture },
      auth: {
        password,
        verificationCode
      }
    });

    await user.save();

    const accessToken = await generateToken(
      { userId: user._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    const refreshToken = await generateToken(
      { userId: user._id },
      "30d",
      process.env.REFRESH_TOKEN_SECRET
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/v1/auth/refreshtoken",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    });

    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationCode: user.auth.verificationCode,
    });

    res.json({
      message:
        "Kullanıcı başarıyla oluşturuldu. Lütfen email adresini doğrula.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.profile.picture,
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new CustomError.BadRequestError(
        "Lütfen e-posta adresinizi ve şifrenizi girin"
      );
    }
    const user = await User.findOne({ email }).select('auth profile');

    if (!user) {
      throw new CustomError.UnauthenticatedError(
        "Ne yazık ki böyle bir kullanıcı yok"
      );
    }
    const isPasswordCorrect = await user.auth.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError("Kayıtlı şifreniz yanlış!");
    }
    if (!user.isVerified) {
      throw new CustomError.UnauthenticatedError(
        "Lütfen e-postanızı doğrulayın !"
      );
    }

    const accessToken = await generateToken(
      { userId: user._id },
      "1d",
      process.env.ACCESS_TOKEN_SECRET
    );
    const refreshToken = await generateToken(
      { userId: user._id },
      "30d",
      process.env.REFRESH_TOKEN_SECRET
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/v1/auth/refreshtoken",
      maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
    });

    const token = new Token({
      refreshToken,
      accessToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      user: user._id,
    });

    await token.save();

    res.json({
      message: "login success.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.profile.picture,
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

//Get My Profile
const getMyProfile = async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  res.status(200).json({
    success: true,
    user,
  });
};

//Logout
const logout = async (req, res, next) => {
  try {
    await Token.findOneAndDelete({ user: req.user.userId });

    res.clearCookie("refreshtoken", { path: "/v1/auth/refreshtoken" });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out!",
    });
  } catch (error) {
    next(error);
  }
};

//Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email");
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    // send email
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.auth.passwordToken = passwordToken;
    user.auth.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Please check your email for reset password link" });
};

//Reset Password
const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    throw new CustomError.BadRequestError("Please provide all values");
  }
  const user = await User.findOne({ email }).select('auth');

  if (user) {
    const currentDate = new Date();

    if (
      user.auth.passwordToken === token &&
      user.auth.passwordTokenExpirationDate > currentDate
    ) {
      user.auth.password = password;
      user.auth.passwordToken = null;
      user.auth.passwordTokenExpirationDate = null;
      await user.save();
    }
  }

  res.send("reset password");
};

//Edit Profile
const editProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new CustomError.NotFoundError("User not found");
    }

    const { name, phoneNumber, address, picture } = req.body;

    // Update basic info
    if (name) user.name = name;
    
    // Update profile
    if (phoneNumber) user.profile.phoneNumber = phoneNumber;
    if (picture) user.profile.picture = picture;

    // Update address
    if (address) {
      user.address = {
        ...user.address,
        ...address
      };
    }

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        address: user.address
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  againEmail,
  forgotPassword,
  resetPassword,
  getMyProfile,
  editProfile,
};
