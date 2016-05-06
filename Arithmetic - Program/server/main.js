Data = new Mongo.Collection("data"); //Create new Mongo collection (Opens existing collection if the name is the same)

var maxQuestionNumber = 10; //Set the maximum number to be generated randomly
var minQuestionNumber = 1; //Set the minimum question

Meteor.startup(function() { //Once the server has booted fully
    console.log("Loaded! :)") //Log to console that it is running
});

Meteor.publish("data", function() { //Publish the Data collection to the client
    return Data.find(); //Just send all the data - not much in the way of security!
});

Meteor.publish("userList", function() { //Publish the full user list to the client
    return Meteor.users.find({}); //Again, send all the users. Better secuity is probably needed but I don't have time.
});

Accounts.onCreateUser(function(options, user) { //During the creation of a new user
  user.averageScore = options.averageScore; //Make sure that the averageScore attribute is created
  user.recentAverageScore = options.recentAverageScore; //Make sure that the totalScore element is also created.
  return user; //Continue with creation like normal
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
        var pastResults = Data.find({ //Query the DB for all of that user's past results
            userId: userId //Searching by ID
        }, {
            fields: {
                correct: 1 //Only need the 'correct' element of the returned results
            }
        }).fetch();
        var totalScore = 0; //Set the total score counter to 0
        for (var i = 0; i < pastResults.length; i++) { //For each result returned from the database
            totalScore = totalScore + pastResults[i]['correct']; //Add the score to the total score var
        }
        averageScore = (totalScore / pastResults.length).toFixed(1); //Divide the total score by the number of results (to get the average), then round to 1 DP.
        Meteor.users.update({ //Update the user database object
            _id: userId //Searching by id again
        }, {
            $set: { //Update/Set the attribute
                averageScore: averageScore //averageScore to the average score we just worked out
            }
        });
        pastResults = Data.find({ //Repeat the query for the recent average
            userId: userId
        }, {
            fields: {
                correct: 1
            },
            limit: 3 //Limit results to 3 most recent
        }).fetch();
        totalScore = 0; //Reset the total score counter back to 0
        for (var i = 0; i < pastResults.length; i++) { //For each result (incase there are less than 3)
            totalScore = totalScore + pastResults[i]['correct']; //Add the score to the total score
        }
        averageScore = (totalScore / pastResults.length).toFixed(1); //Same again - calculate the average score to 1DP.
        Meteor.users.update({ //Find and update the user object
            _id: userId //Searching by ID
        }, {
            $set: {
                recentAverageScore: averageScore //Set the recentAverageScore attribute to the score we just calculated
            }
        });
    },
    'createNewUser': function(username, password, role) { //Create a new user from the given parameters
        var id = Accounts.createUser({ //Calling the built in createUser function
            username: username, //Set their username to the argument given
            password: password, //Set their password to the argument given
            averageScore: 0, //Set their averageScore to 0, as they haven't comleted any results yet
            recentAverageScore: 0 //Set their recentAverageScore to 0, as they haven't' calculated any results yet.
        });
        if (role != null) { //If no role has been given to the function
            Roles.addUsersToRoles(id, role); //Add the user to the given role
        } else { //If no role has been provided
            Roles.addUsersToRoles(id, "Class 1"); //Just add them to Class 1.
        }
        return id;
    },
    'getRolesForUser': function(id) { //Return the role(s) for a given user
        return Roles.getRolesForUser(id); //Return straight from the Roles function
    },
    'moveUserToRole': function(username, role) { //Move a user to a specified role
        var user = Accounts.findUserByUsername(username); //Find the actual user object (required by Roles)
        Roles.removeUsersFromRoles(user, Roles.getRolesForUser(user)); //Remove the user from any roles they are in
        Roles.addUsersToRoles(user, role); //Then add them to the given role
    },
    'generateUserData': function(username, score) { //Generate random data for the user (used for debugging/demostration)
        if (score == "") { //If a manual score override has not been given
            score = Math.floor(Math.random() * 11); //Generate a random score between 1 and 10.
        }
        var answerLog = [] //Create a new answeLog array (similar to the Session variable but entirely local)
        var question; //Create a new question
        for (var i = 0; i < score; i++) { //For whatever score we want the user to get
            question = Meteor.call('generateQuestion'); //Generate a question from the generateQuestion function
            answerLog.push([question, eval(question)]); //Push the question and then calculate the answer and push that too.
        }
        for (var j = 0; j < 10 - i; j++) { //For the rest of the questions (the ones we want to get wrong)
            question = Meteor.call('generateQuestion'); //Generate another question
            answerLog.push([question, eval(question) + 1]); //And push the question, and then a wrong answer, to the array)
        }
        Meteor.call('submitAnswers', answerLog, score, Accounts.findUserByUsername(username)._id, username); //Submit the answerLog like normal using the submitAnswers function
    },
    'deleteUser': function(username) { //Delete a given user (by username)
        if(username != 'admin'){ //Disallow deletion of the 'admin' account, to prevent lockout
          Data.remove({ //Delete all stored result data
              username: username //Searching by username
          });
          Meteor.users.remove({ //Delete the actual user object from the DB.
              username: username //Again, searching by username
          });
        }
    },
    'changeUserPassword': function(id, newPassword){ //Change the password of a given user to a given password
      Accounts.setPassword(id, newPassword, { //Use the built in setPassword function
        logout: false //Don't log the user out if they are currently logged in (to prevent page refresh)
      });
    }
});
