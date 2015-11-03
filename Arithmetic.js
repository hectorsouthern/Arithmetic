if (Meteor.isClient) {
  Template.quiz.events({
    'click #nq': function(){
      Meteor.call("generateQuestion", function(err, data){
        if (err){
          console.log(err);
        }
        console.log(data.question);
        console.log(data.answer);
        Session.set('question', data.question);
      });
    }
  });

  Template.quiz.helpers({
    'question': function(){
      return Session.get('question');
    }
  });
}

if (Meteor.isServer) {
  var maxQuestionNumber = 10;
  var minQuestionNumber = 1;
  Meteor.startup(function () {
    console.log("Running! :)")
  });
  Meteor.methods({
    'generateQuestion': function(){
        var questionPart1 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
        var questionPart2 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
        var rndbool = Math.random() >= 0.5;
        var result = {};
        if(rndbool){
          result.question = questionPart1 + " + " + questionPart2;
          result.answer = questionPart1 + questionPart2;
          return result;
        } else {
          result.question = questionPart1 + " - " + questionPart2;
          result.answer = questionPart1 - questionPart2;
          return result;
        }
      }
  });
}
