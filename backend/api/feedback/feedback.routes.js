import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getFeedback, saveFeedback, removeFeedback } from './feedback.controller.js'

const router = express.Router()

// Every route is scoped to the logged in user, so none of them takes a user id
router.get('/', requireAuth, getFeedback)
router.post('/', requireAuth, saveFeedback)
router.delete('/', requireAuth, removeFeedback)

export const feedbackRoutes = router
