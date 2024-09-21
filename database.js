import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.db', (err) => {
  if(err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Database opened');
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS polls (poll_id INTEGER PRIMARY KEY, nillion_id TEXT, title TEXT, description TEXT, image TEXT, is_quadratic_voting INTEGER, creator TEXT, start_date TEXT, end_date TEXT, voting_options TEXT, results TEXT, status TEXT, questionaire TEXT, user_ids TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, user_name TEXT, email TEXT, wallet TEXT, poll_ids TEXT)');
})

export default db;