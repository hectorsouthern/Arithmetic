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
  }
});
