Session.set('questionNum', 1);
Session.set('answerLog', []);

//TEMPLATE 'QUIZ'

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
      } else {
        Session.set('feedback', 'Wrong.');
      }
      addToAnswerLog(Session.get('question'), userAnswer);
      if(Session.get('questionNum') >= 10){
        Meteor.call('submitAnswers', Session.get('answerLog'));
        Router.go('results');
      } else {
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
  },
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

addToAnswerLog = function(var1, var2){
  var array = Session.get('answerLog');
  array.push([var1, var2]);
  Session.set('answerLog', array);
}

//TEMPLATE 'RESULTS'

Template.results.helpers({
  'settings': function(){
    var tableData = getTableData();
    return {
      showFilter: false,
      showNavigation: 'never',
      collection: tableData.data,
      showNavigationRowsPerPage: false,
      fields: [
        {key: '0', label: 'Question', sortable: false},
        {key: '1', label: 'Your Answer', sortable: false},
        {key: '2', label: 'Correct Answer', sortable: false, hidden: function() {
          if(tableData.wrongAns == 0){
            return true;
          } else {
            return false;
          }
        }}
      ]
    };
  }
});

getTableData = function(){
    var array = Session.get('answerLog');
    var wrongAns = 0;
    for (var i = 0; i < array.length; i++) {
      console.log(array[i][0] + " " + array[i][1]);
      if(eval(array[i][0]) != array[i][1]){
        console.log("Wrong");
        array[i].push(eval(array[i][0]))
        wrongAns++;
      }
    }
    var tableData = {data: array, wrongAns: wrongAns};
    return tableData;
}
