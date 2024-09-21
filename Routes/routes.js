import express from 'express';

import { getPollsByStatus, getAllPolls, getPollByID, getPollsByCreator, getQuizFromPoll, addUserWalletToPoll, createPoll, addNillionIdToPoll, createUser, deletePoll, deleteAllPolls } from '../Controllers/backController.js';

const router = express.Router();

router.get('/polls/status/:status', getPollsByStatus);
router.get('/polls', getAllPolls);
router.get('/polls/:id', getPollByID);
router.get('/polls/creator/:creator', getPollsByCreator);
router.get('/polls/quiz/:id', getQuizFromPoll);
router.post('/create-poll', createPoll);
router.post('/add-nillion-id-to-poll/:id', addNillionIdToPoll);
router.post('/add-wallet-to-poll/:id', addUserWalletToPoll);
router.post('/create-user', createUser);
router.delete('/delete-poll/:id', deletePoll);
router.delete('/delete-all-polls', deleteAllPolls);

export default router;