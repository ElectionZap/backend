import express from 'express';

import { getPollsByStatus, getAllPolls, getPollByID, createPoll, createUser } from '../Controllers/backController.js';

const router = express.Router();

router.get('/polls/:status', getPollsByStatus);
router.get('/polls', getAllPolls);
router.get('/polls/:id', getPollByID);
router.post('/create-poll', createPoll);
router.post('/create-user', createUser);

export default router;