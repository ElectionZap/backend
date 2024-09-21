import db from "../database.js";

export const getPollsByStatus = async (req, res) => {
  const { status } = req.params;
  db.all("SELECT * FROM polls WHERE status = ?", [status], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: `No ${status} polls found` });
    }

    let polls;
    switch (status) {
      case "ongoing":
        polls = rows.map((row) => {
          const { results, ...rest } = row; // Destructuring to exclude `results`
          return rest; // Return the remaining properties
        });
        break;
      case "ended":
        polls = rows.map((row) => ({
          ...row,
        }));
        break;
      default:
        return res.status(400).json({ message: "Invalid status" });
    }

    res.status(200).json({ polls });
  });
};

export const getPollByID = async (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM polls WHERE poll_id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    res.status(200).json({ poll: row });
  });
}

// TODO: Implement better query for getting polls by creator
export const getPollsByCreator = async (req, res) => {
  const { creator } = req.params;
  db.all("SELECT * FROM polls WHERE creator = ?", [creator], (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: `No polls found for creator ${creator}` });
    }

    res.status(200).json({ polls: rows });
  });
}

export const getAllPolls = async (req, res) => {
  db.all("SELECT * FROM polls", (err, rows) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "No polls found" });
    }

    res.status(200).json({ polls: rows });
  });
}

export const createPoll = async (req, res) => {
  const { title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs } = req.body;
  db.run("INSERT INTO polls (title, description, is_quadratic_voting, creator, start_date, end_date, voting_options, results, status, questionaire, user_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs], function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error creating poll",
        error: err.message,
      });
    }

    //TODO: Add poll to creator's poll_ids

    res.status(201).json({ poll_id: this.lastID });
  });
}

// QUESTIONAIRE SUBMITION WILL BE DONE IN MACI CONTRACT (AND IT IS NOT WELL IMPLEMENTED YET)
// export const submitUsersQuestionaireAnswers = async (req, res) => {
//   const { id } = req.params;
//   const { userIDs, questionaireAnswers } = req.body;
//   db.get("SELECT * FROM polls WHERE poll_id = ?", [id], (err, row) => {
//     if (err) {
//       return res.status(500).json({
//         message: "Error getting poll data",
//         error: err.message,
//       });
//     }

//     if (!row) {
//       return res.status(404).json({ message: `Poll with ID ${id} not found` });
//     }

//     const { questionaire } = row;
//     if (questionaire.length !== questionaireAnswers.length) {
//       return res.status(400).json({ message: "Invalid questionaire answers" });
//     }

//     db.run("UPDATE polls SET user_ids = ?, questionaire_answers = ? WHERE poll_id = ?", [userIDs, questionaireAnswers, id], function(err) {
//       if (err) {
//         return res.status(500).json({
//           message: "Error submitting questionaire answers",
//           error: err.message,
//         });
//       }

//       res.status(200).json({ message: "Questionaire answers submitted successfully" });
//     });
//   });
// }

// VOTE SUBMITION WILL BE DONE IN MACI CONTRACT
// export const submitVote = async (req, res) => {
//   const { id } = req.params;
//   const { vote, userID } = req.body;
//   db.get("SELECT * FROM polls WHERE poll_id = ?", [id], (err, row) => {
//     if (err) {
//       return res.status(500).json({
//         message: "Error getting poll data",
//         error: err.message,
//       });
//     }

//     if (!row) {
//       return res.status(404).json({ message: `Poll with ID ${id} not found` });
//     }

//     const { votingOptions, results } = row;
//     const voteIndex = votingOptions.findIndex((option) => option === vote);
//     if (voteIndex === -1) {
//       return res.status(400).json({ message: "Invalid vote" });
//     }

//     const newResults = [...results];
//     newResults[voteIndex] += 1;

//     db.run("UPDATE polls SET results = ? WHERE poll_id = ?", [newResults, id], function(err) {
//       if (err) {
//         return res.status(500).json({
//           message: "Error submitting vote",
//           error: err.message,
//         });
//       }

//       res.status(200).json({ message: "Vote submitted successfully" });
//     });
//   });
// }

export const addUserWalletToPoll = async (req, res) => {
  const { id } = req.params;
  const { wallet } = req.body;
  db.get("SELECT * FROM polls WHERE poll_id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }
    
    if (!row) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    const { user_ids } = row;
    let newUsers;

    if(!user_ids) {
      newUsers = JSON.stringify([wallet]);
    }else {
      const users = JSON.parse(user_ids);
      if(users.includes(wallet)) {
        return res.status(400).json({ message: "User already added to poll" });
      }
      users.push(wallet);
      newUsers = JSON.stringify(users);
    }

    db.run("UPDATE polls SET user_ids = ? WHERE poll_id = ?", [newUsers, id], function(err) {
      if (err) {
        return res.status(500).json({
          message: "Error adding user to poll",
          error: err.message,
        });
      }

      res.status(200).json({ message: "User added to poll successfully" });
    });
  });
}

export const updatePoll = async (req, res) => {
  const { id } = req.params;
  const { title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs } = req.body;
  db.run("UPDATE polls SET title = ?, description = ?, is_quadratic_voting = ?, creator = ?, start_date = ?, end_date = ?, voting_options = ?, results = ?, status = ?, questionaire = ?, user_ids = ? WHERE poll_id = ?", [title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs, id], function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error updating poll",
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    res.status(200).json({ message: `Poll with ID ${id} updated successfully` });
  });
}

export const deletePoll = async (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM polls WHERE poll_id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error deleting poll",
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    res.status(200).json({ message: `Poll with ID ${id} deleted successfully` });
  });
}


// SHOULD NOT USE THIS ANYMORE
export const createUser = async (req, res) => {
  const { userName, email, wallet, pollIDs } = req.body;
  //checks if user already exists by wallet
  db.get("SELECT * FROM users WHERE wallet = ?", [wallet], (err, row) => {
    if (err) {
      return res.status(500).json({
        message: "Error checking if user exists",
        error: err.message,
      });
    }

    if (row) {
      return res.status(400).json({ message: "User already exists" });
    }
  });

  db.run("INSERT INTO users (user_name, email, wallet, poll_ids) VALUES (?, ?, ?, ?)", [userName, email, wallet, pollIDs], function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error creating user",
        error: err.message,
      });
    }

    res.status(201).json({ user_id: this.lastID });
  });
}