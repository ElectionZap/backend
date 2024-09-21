import db from "../database.js";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

// should do this in a separate file
const openai = new OpenAI({
  baseURL: "https://api.red-pill.ai/v1",
  apiKey: process.env.REDPILL_KEY,
});

const generateQuestionaire = async (
  title,
  description,
  votingOptions
) => {
  // [{ "id": 1, "option": "Pikachu"},{ "id": 2, "option": "Charizard"}] voting options example
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Generate a quiz for a poll titled ${title} with the description ${description}.
          The poll has the following voting options: ${votingOptions.map((option) => option.option).join(", ")}.
          you have to generate a main question and 6 support questions with 5 options each.
          also, your OUTPUT MUST follow the format below: (IT HAS TO BE WRITTEN AS A STRINGIFIED JSON)
          "{
            "main_question": "Main Question",
            "main_options": ["Option 0", "Option 1"],
            "support_questions": [
              {
                "question": "Support Question 1",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [0, 1, 2, 3, 4],
                  "option_1_weights": [4, 3, 2, 1, 0]
                }
              },
              {
                "question": "Support Question 2",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [2, 2, 1, 0, 1],
                  "option_1_weights": [1, 0, 3, 2, 2]
                }
              },
              {
                "question": "Support Question 3",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [1, 0, 2, 2, 3],
                  "option_1_weights": [3, 2, 1, 0, 1]
                }
              },
              {
                "question": "Support Question 4",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [1, 3, 0, 2, 1],
                  "option_1_weights": [2, 1, 3, 0, 2]
                }
              },
              {
                "question": "Support Question 5",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [3, 1, 2, 0, 1],
                  "option_1_weights": [0, 2, 1, 3, 1]
                }
              },
              {
                "question": "Support Question 6",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                "weights": {
                  "option_0_weights": [0, 2, 1, 0, 3],
                  "option_1_weights": [2, 1, 3, 2, 0]
                }
              }
            ]
          }"
        `,
      },
    ],
    model: "gpt-4o",
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
};


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

    res.status(200).json(polls);
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

    res.status(200).json(row);
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

    res.status(200).json( rows );
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

    res.status(200).json(rows);
  });
}

function cleanJSONString(input) {
  // Replace backticks and the 'json' label with empty strings
  // Also replace \n and \ with empty strings
  return input.replace(/`|json|\\n|\\/g, "");
}

export const createPoll = async (req, res) => {
  const { title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs } = req.body;

  const stringifyVotingOptions = JSON.stringify(votingOptions);

  // Generate questionaire based on title and description
  const generatedQuestionaire = await generateQuestionaire(title, description, votingOptions);

  // Clean the JSON string
  const cleanedQuestionaire = cleanJSONString(generatedQuestionaire);
  console.log(cleanedQuestionaire);

  db.run("INSERT INTO polls (title, description, is_quadratic_voting, creator, start_date, end_date, voting_options, results, status, questionaire, user_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [title, description, isQuadraticVoting, creator, startDate, endDate, stringifyVotingOptions, results, status, cleanedQuestionaire, userIDs], function(err) {
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

export const addNillionIdToPoll = async (req, res) => {
  const { id } = req.params;
  const { nillionId } = req.body;
  db.run("UPDATE polls SET nillion_id = ? WHERE poll_id = ?", [nillionId, id], function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error adding Nillion ID to poll",
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    res.status(200).json({ message: `Nillion ID added to poll with ID ${id} successfully` });
  });
}

// row.questionaire = "\n{\n  \"main_question\": \"Which is the best pizza flavor?\",\n  \"main_options\": [\"Margueritta\", \"Pepperoni\"],\n  \"support_questions\": [\n    {\n      \"question\": \"Which crust type do you prefer?\",\n      \"options\": [\"Thin Crust\", \"Thick Crust\", \"Stuffed Crust\", \"Cheese Burst\", \"Gluten-Free\"],\n      \"weights\": {\n        \"option_0_weights\": [0, 1, 2, 3, 4],\n        \"option_1_weights\": [4, 3, 2, 1, 0]\n      }\n    },\n    {\n      \"question\": \"What sauce do you like on your pizza?\",\n      \"options\": [\"Tomato\", \"Pesto\", \"Alfredo\", \"Barbecue\", \"Garlic Parmesan\"],\n      \"weights\": {\n        \"option_0_weights\": [2, 2, 1, 0, 1],\n        \"option_1_weights\": [1, 0, 3, 2, 2]\n      }\n    },\n    {\n      \"question\": \"Which cheese combination do you prefer?\",\n      \"options\": [\"Mozzarella\", \"Cheddar\", \"Parmesan\", \"Feta\", \"Goat Cheese\"],\n      \"weights\": {\n        \"option_0_weights\": [1, 0, 2, 2, 3],\n        \"option_1_weights\": [3, 2, 1, 0, 1]\n      }\n    },\n    {\n      \"question\": \"How spicy do you like your pizza?\",\n      \"options\": [\"Not Spicy\", \"Mild\", \"Medium\", \"Hot\", \"Extra Hot\"],\n      \"weights\": {\n        \"option_0_weights\": [1, 3, 0, 2, 1],\n        \"option_1_weights\": [2, 1, 3, 0, 2]\n      }\n    },\n    {\n      \"question\": \"What is your favorite pizza topping?\",\n      \"options\": [\"Olives\", \"Mushrooms\", \"Onions\", \"Bacon\", \"Bell Peppers\"],\n      \"weights\": {\n        \"option_0_weights\": [3, 1, 2, 0, 1],\n        \"option_1_weights\": [0, 2, 1, 3, 1]\n      }\n    },\n    {\n      \"question\": \"Which pizza size do you usually order?\",\n      \"options\": [\"Small\", \"Medium\", \"Large\", \"Extra Large\", \"Personal Size\"],\n      \"weights\": {\n        \"option_0_weights\": [0, 2, 1, 0, 3],\n        \"option_1_weights\": [2, 1, 3, 2, 0]\n      }\n    }\n  ]\n}\n"

export const getQuizFromPoll = async (req, res) => {
  const { id } = req.params;
  db.get("SELECT questionaire FROM polls WHERE poll_id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        message: "Error getting poll data",
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({ message: `Poll with ID ${id} not found` });
    }

    // transform the string row.questionaire to a JSON object
    const cleanedQuestionaire = JSON.parse(row.questionaire);
    res.status(200).json( cleanedQuestionaire );
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

export const deleteAllPolls = async (req, res) => {
  db.run("DELETE FROM polls", function(err) {
    if (err) {
      return res.status(500).json({
        message: "Error deleting polls",
        error: err.message,
      });
    }

    res.status(200).json({ message: "All polls deleted successfully" });
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