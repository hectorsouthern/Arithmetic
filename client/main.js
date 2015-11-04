Session.set('questionNum', 1);
Template.quiz.rendered = function(){
  if(!this.rendered){
    this._rendered = true;
    nextQuestion(true);
  }
};

Template.quiz.events({
  'click #nq': function(){
    nextQuestion();
  },
  'submit #answer': function(event) {
    event.preventDefault();
    var userAnswer = event.target.answer.value;
    event.target.answer.value = '';
    if(userAnswer.length == 0){
      console.log('Empty Input!');
    } else if (userAnswer.match(/[a-z]/i)) {
      console.log('Invalid Input!');
    } else {
      console.log('Submitted: ' + userAnswer);
      console.log('Expecting: ' + eval(Session.get('question')));
      if(userAnswer == eval(Session.get('question'))){
        Session.set('feedback', 'Correct!');
        nextQuestion();
      } else {
        Session.set('feedback', 'Wrong.');
        nextQuestion();
      }
    }
  }
});

Template.quiz.helpers({
  'question': function(){
    return Session.get('question');
  },
  'feedback': function(){
    return Session.get('feedback');
  },
  'questionNum': function(){
    return Session.get('questionNum');
  }
});

nextQuestion = function(noincrement){
  Meteor.call('generateQuestion', function(err, data){
    if (err){
      console.log(err);
    }
    Session.set('question', data);
    if(!noincrement){
      Session.set('questionNum', Session.get('questionNum') + 1);
    }
  });
}
