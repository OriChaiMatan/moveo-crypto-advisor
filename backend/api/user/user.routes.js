import express from 'express'

import { requireAuth, optionalAuth } from '../../middlewares/requireAuth.middleware.js'
import { getLoggedinUser, updatePreferences } from './user.controller.js'

const router = express.Router()

// Answers who is logged in, and answers with null when nobody is
router.get('/', optionalAuth, getLoggedinUser)
router.put('/preferences', requireAuth, updatePreferences)

export const userRoutes = router
