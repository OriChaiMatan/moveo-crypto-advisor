import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { getCoins, getCoinHistory, getInsight, getNews, getMeme } from './dashboard.controller.js'

const router = express.Router()

// Every section is its own route, so one failing section cannot take down another
router.get('/coins', requireAuth, getCoins)
router.get('/coins/:coinId/history', requireAuth, getCoinHistory)
router.get('/insight', requireAuth, getInsight)
router.get('/news', requireAuth, getNews)
router.get('/meme', requireAuth, getMeme)

export const dashboardRoutes = router
