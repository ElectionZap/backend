// class Poll {
//     constructor(id, title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs) {
//       this.id = id;
//       this.title = title;
//       this.description = description;
//       this.isQuadraticVoting = isQuadraticVoting;
//       this.creator = creator;
//       this.startDate = startDate;
//       this.endDate = endDate;
//       this.votingOptions = votingOptions;
//       this.results = results;
//       this.status = status;
//       this.questionaire = questionaire;
//       this.userIDs = userIDs;
//     }
// }
  
// class User {
//     constructor(id, userName, email, wallet, pollIDs) {
//         this.id = id;
//         this.userName = userName;
//         this.email = email;
//         this.wallet = wallet;
//         this.pollIDs = pollIDs;
//     }
// }


export type Pool = {
    id: number,
    title: string,
    description: string,
    isQuadraticVoting: boolean,
    creator: {
        id: number,
        wallet: string[]
    },
    startDate: string,
    endDate: string,
    votingOptions: VotingOption[],
    results: string,
    status: string,
    questionaire: string,
    userIDs: string[]
}

export type VotingOption = {
    option: string,
    votes: number
}

export type Questionaire = {
    question: string,
    options: string[]
}

export type User = {
    id: number,
    userName: string,
    email: string,
    wallet: string[],
    pollIDs: string[]
}