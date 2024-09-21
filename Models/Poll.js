class Poll {
    constructor(id, title, description, isQuadraticVoting, creator, startDate, endDate, votingOptions, results, status, questionaire, userIDs) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.isQuadraticVoting = isQuadraticVoting;
      this.creator = creator;
      this.startDate = startDate;
      this.endDate = endDate;
      this.votingOptions = votingOptions;
      this.results = results;
      this.status = status;
      this.questionaire = questionaire;
      this.userIDs = userIDs;
    }
}
  
export default Poll;