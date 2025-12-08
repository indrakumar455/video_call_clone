import { User } from "../models/userschema.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/mettingSchema.js";

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "please provide" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(httpStatus.NOT_FOUND).json({ message: "user is not exists." });
    }
    let isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      let token = crypto.randomBytes(20).toString("hex");
      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "invalid username or password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `something want wrong ${e}` });
  }
};

const register = async (req, res) => {
  const { username, name, password } = req.body;

  try {
    const existing = await User.findOne({ name });
    if (existing) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "user already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "User Registed." });
  } catch (e) {
    res.json(`message: something want wrong${e}`);
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ token: token });
    const meeting = await Meeting.find({ user_id: user.username });
    res.json(meeting);
  } catch (e) {
    res.json({ message: `something want wrong ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;
  try {
    const user = await User.findOne({ token: token });
    const newMeeting = await Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();
    res.status(httpStatus.CREATED).json({ message: "Add code to history" });
  } catch (e) {
    res.json({ message: `something want wrong ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory };
