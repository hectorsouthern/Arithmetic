Data = new Mongo.Collection("data"); //Create new Mongo collection (Opens existing collection if the name is the same)

var maxQuestionNumber = 10;
var minQuestionNumber = 1;

Meteor.startup(function() {
    console.log("Loaded! :)")
});

Meteor.publish("data", function() {
    return Data.find();
});

Meteor.publish("userList", function() {
    return Meteor.users.find({});
});

Accounts.onCreateUser(function(options, user) {
  user.averageScore = options.averageScore;
  user.recentAverageScore = options.recentAverageScore;
  return user;
});

Meteor.methods({
    'generateQuestion': function() {
        var questionPart1 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber); //Pick a random number between the minQuestionNumber and maxQuestionNumber, rounding it to an integer
        var questionPart2 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber); //Same again for the second number in the question.
        var operation = Math.floor(Math.random() * 3) + 1 //Pick a random number between 1 and 3
        if (operation == 1) { //If it equals 1
            return (questionPart1 + " + " + questionPart2); //Return the numbers and use the addition operator.
        } else if (operation == 2) { //If it equals 2
            return (questionPart1 + " - " + questionPart2); //Return the numbers and use the subtraction operator.
        } else if (operation == 3) { //If it equals 3
            return (questionPart1 + " * " + questionPart2); //Return the numbers and use the multiplication operator.
        }
    },
    'submitAnswers': function(array, CorrectNum, userId, username) { //Server function to insert data into the database
        Data.insert({ //Begin a new insertion into the database named "Data" (opened at server launch)
            userId: userId, //Store the id of the user
            username: username, //Store the username of the user
            date: new Date().toISOString(), //Store the date and time the user submitted their answers
            correct: CorrectNum, //Store the number of questions correctly answered
            q1: [array[0][0], array[0][1]], //Store the question and user's answer under the element q1
            q2: [array[1][0], array[1][1]], //Same as above into q2
            q3: [array[2][0], array[2][1]], //Same as above into q3
            q4: [array[3][0], array[3][1]], //Same as above into q4
            q5: [array[4][0], array[4][1]], //Same as above into q5
            q6: [array[5][0], array[5][1]], //Same as above into q6
            q7: [array[6][0], array[6][1]], //Same as above into q7
            q8: [array[7][0], array[7][1]], //Same as above into q8
            q9: [array[8][0], array[8][1]], //Same as above into q9
            q10: [array[9][0], array[9][1]] //Same as above into q10
        });
        var pastResults = Data.find({
            userId: userId
        }, {
            fields: {
                correct: 1
            }
        }).fetch();
        var totalScore = 0;
        for (var i = 0; i < pastResults.length; i++) {
            totalScore = totalScore + pastResults[i]['correct'];
        }
        averageScore = (totalScore / pastResults.length).toFixed(1);
        Meteor.users.update({
            _id: userId
        }, {
            $set: {
                averageScore: averageScore
            }
        });
        pastResults = Data.find({
            userId: userId
        }, {
            fields: {
                correct: 1
            },
            limit: 3
        }).fetch();
        totalScore = 0;
        for (var i = 0; i < pastResults.length; i++) {
            totalScore = totalScore + pastResults[i]['correct'];
        }
        averageScore = (totalScore / pastResults.length).toFixed(1);
        Meteor.users.update({
            _id: userId
        }, {
            $set: {
                recentAverageScore: averageScore
            }
        });
    },
    'createNewUser': function(username, password, role) {
        var id = Accounts.createUser({
            username: username,
            password: password,
            averageScore: 0,
            recentAverageScore: 0
        });
        if (role != null) {
            Roles.addUsersToRoles(id, role);
        } else {
            Roles.addUsersToRoles(id, "Class 1");
        }
        return id;
    },
    'getRolesForUser': function(id) {
        return Roles.getRolesForUser(id);
    },
    'moveUserToRole': function(username, role) {
        //TODO errors
        var user = Accounts.findUserByUsername(username);
        Roles.removeUsersFromRoles(user, Roles.getRolesForUser(user));
        Roles.addUsersToRoles(user, role);
    },
    'generateUserData': function(username, score) {
        if (score == "") {
            score = Math.floor(Math.random() * 11);
        }
        var answerLog = []
        var question;
        for (var i = 0; i < score; i++) {
            question = Meteor.call('generateQuestion');
            answerLog.push([question, eval(question)]);
        }
        for (var j = 0; j < 10 - i; j++) {
            question = Meteor.call('generateQuestion');
            answerLog.push([question, eval(question) + 1]);
        }
        Meteor.call('submitAnswers', answerLog, score, Accounts.findUserByUsername(username)._id, username);
    },
    'deleteUser': function(username) {
        if(username != 'admin'){
          Data.remove({
              username: username
          });
          Meteor.users.remove({
              username: username
          });
        }
    },
    'changeUserPassword': function(id, newPassword){
      Accounts.setPassword(id, newPassword, {
        logout: false
      });
    }
});
