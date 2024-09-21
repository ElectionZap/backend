import express from 'express';

import { getPollsByStatus, getAllPolls, getPollByID, getPollsByCreator, addUserWalletToPoll, createPoll, addNillionIdToPoll, createUser, deletePoll } from '../Controllers/backController.js';

const router = express.Router();

router.get('/polls/status/:status', getPollsByStatus);
router.get('/polls', getAllPolls);
router.get('/polls/:id', getPollByID);
router.get('/polls/creator/:creator', getPollsByCreator);
router.post('/create-poll', createPoll);
router.post('/add-nillion-id-to-poll/:id', addNillionIdToPoll);
router.post('/add-wallet-to-poll/:id', addUserWalletToPoll);
router.post('/create-user', createUser);
router.delete('/delete-poll/:id', deletePoll);

export default router;