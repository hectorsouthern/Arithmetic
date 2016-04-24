Data = new Mongo.Collection("data");

var maxQuestionNumber = 10;
var minQuestionNumber = 1;

Meteor.startup(function() {
    console.log("Loaded! :)")
});

Meteor.publish("data", function() {
    return Data.find();
});

Meteor.methods({
    'generateQuestion': function() {
        var questionPart1 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
        var questionPart2 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
        var rndbool = Math.random() >= 0.5;
        if (rndbool) {
            return (questionPart1 + " + " + questionPart2);
        } else {
            return (questionPart1 + " - " + questionPart2);
        }
    },
    'submitAnswers': function(array, CorrectNum, userId, username) {
        Data.insert({
            userId: userId,
            username: username,
            date: new Date().toISOString(),
            correct: CorrectNum,
            q1: [array[0][0], array[0][1]],
            q2: [array[1][0], array[1][1]],
            q3: [array[2][0], array[2][1]],
            q4: [array[3][0], array[3][1]],
            q5: [array[4][0], array[4][1]],
            q6: [array[5][0], array[5][1]],
            q7: [array[6][0], array[6][1]],
            q8: [array[7][0], array[7][1]],
            q9: [array[8][0], array[8][1]],
            q10: [array[9][0], array[9][1]]
        });
    },
    'createNewUser': function(username, password, role) {
        if (!Roles.userIsInRole(this.userId, ['teacher'])) {
            //TODO RENABLE FOR PROD.
            // throw new Meteor.Error('Invalid Rights.', 'Only teachers can create new users.');
            console.log("Only teachers can create new users! Ignoring for prod!");
        }
        var id = Accounts.createUser({
            username: username,
            password: password
        });
        Roles.addUsersToRoles(id, role);
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
    }
});
