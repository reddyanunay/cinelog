import { Request, Response, NextFunction } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { asyncHandler, CustomError } from '../middleware/errorHandler';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export const register = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password) {
      const error: CustomError = new Error('Please provide username, email, and password');
      error.statusCode = 400;
      throw error;
    }

    if (password !== confirmPassword) {
      const error: CustomError = new Error('Passwords do not match');
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const error: CustomError = new Error('Email or username already registered');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  }
);

export const login = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      const error: CustomError = new Error('Please provide email and password');
      error.statusCode = 400;
      throw error;
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const error: CustomError = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      const error: CustomError = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  }
);

export const getProfile = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);
