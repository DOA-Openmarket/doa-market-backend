import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validate.middleware';
import Joi from 'joi';
import { UserRole } from '@/models/User';

const router = Router();
const authController = new AuthController();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  phoneNumber: Joi.string()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      'any.only': 'Role must be one of: customer, seller, admin',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

const verifyEmailParamsSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.uuid': 'Invalid user ID format',
    'any.required': 'User ID is required',
  }),
});

// Routes
router.post(
  '/register',
  ValidationMiddleware.validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  ValidationMiddleware.validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  ValidationMiddleware.validate(refreshSchema),
  authController.refresh
);

router.post(
  '/logout',
  ValidationMiddleware.validate(logoutSchema),
  authController.logout
);

router.get(
  '/me',
  AuthMiddleware.authenticate,
  authController.me
);

router.post(
  '/verify-email/:userId',
  ValidationMiddleware.validateParams(verifyEmailParamsSchema),
  authController.verifyEmail
);

export default router;
