Data = new Mongo.Collection("data");

var maxQuestionNumber = 10;
var minQuestionNumber = 1;
Meteor.startup(function () {
  console.log("Loaded! :)")
});
Meteor.methods({
  'generateQuestion': function(){
    var questionPart1 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
    var questionPart2 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
    var rndbool = Math.random() >= 0.5;
    if(rndbool){
      return (questionPart1 + " + " + questionPart2);
    } else {
      return (questionPart1 + " - " + questionPart2);
    }
  },
  'submitAnswers': function(array){
    Data.insert({
      name: "TODO",
      date: new Date().toISOString(),
      q1: [array[0][0],array[0][1]],
      q2: [array[1][0],array[1][1]],
      q3: [array[2][0],array[2][1]],
      q4: [array[3][0],array[3][1]],
      q5: [array[4][0],array[4][1]],
      q6: [array[5][0],array[5][1]],
      q7: [array[6][0],array[6][1]],
      q8: [array[7][0],array[7][1]],
      q9: [array[8][0],array[8][1]],
      q10: [array[9][0],array[9][1]]
    });
  }
});
