import { Router } from 'express';
import { userProfileController } from '@controllers/user-profile.controller';

const router = Router();

// GET /api/v1/profiles - Get all profiles (with pagination)
router.get('/', userProfileController.getAllProfiles.bind(userProfileController));

// GET /api/v1/profiles/search - Search profiles
router.get('/search', userProfileController.searchProfiles.bind(userProfileController));

// GET /api/v1/profiles/:userId - Get profile by user ID
router.get('/:userId', userProfileController.getProfile.bind(userProfileController));

// POST /api/v1/profiles - Create new profile
router.post('/', userProfileController.createProfile.bind(userProfileController));

// PUT /api/v1/profiles/:userId - Update profile
router.put('/:userId', userProfileController.updateProfile.bind(userProfileController));

// DELETE /api/v1/profiles/:userId - Delete profile
router.delete('/:userId', userProfileController.deleteProfile.bind(userProfileController));

export default router;
