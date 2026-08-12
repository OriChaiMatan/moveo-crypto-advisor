import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getLoggedinUser, updatePreferences } from './user.controller.js'

const router = express.Router()

router.get('/', requireAuth, getLoggedinUser)
router.put('/preferences', requireAuth, updatePreferences)

export const userRoutes = router
