// |**********************************************************************;
// * Project           : OCR Computing Programming Project - Arithmetic Quiz A453
// *
// * Author            : Hector Southern 11Y
// *
// * Date created      : 03/11/2015 (First Commit)
// *
// * File              : Clientside JavaScript - /client/main.js
// |**********************************************************************;

//-----NOTES-----
//Meteor uses a templating system (Handlebars). These correspond to HTML templates stored in /Arithmetic.html
//Meteor uses MongoDB for the database - this is a NoSQL document store, so no SQL queries are used.
// .rendered - called when the page has been fully displayed
// .events - reactions to various events the user may cause (e.g. click a button)
// .helpers - Passing dynamic strings into the template, such as the currently logged in user.
// The Session.get/Session.set system creates a global object on the client. Each session is it's own instance.
// These functions/callbacks ARE NOT RUN CHRONOLOGICALLY. Different ones will run depending on the user's location and actions.
// Roles and Groups are used interchangably - plugin is called Roles.

Data = new Mongo.Collection("data"); //Create a blank Mongo (database) ready for past results to be stored in,
Meteor.subscribe("data"); //Recieve data published from server and store under the variable 'Data'. Contains all of the stored arithmetic results.
Meteor.subscribe("userList") //Recieve data published from the server regarding users.

Accounts.ui.config({ //Configure the account management plugin to require a username only.
    passwordSignupFields: 'USERNAME_ONLY'
});

//TEMPLATE 'QUIZ'

Template.quiz.rendered = function() { //When the 'quiz' page has been displayed
    nextQuestion(true); //Generate the first question when the page loads.
    Session.set('newUserFeedback', ''); //Reset the account creation feedback variable.
    Session.set('questionNum', 1); //Reset the question counter back to 1
    Session.set('CorrectNum', 0); //Reset the number of questions correctly answered back to 0
    Session.set('answerLog', []); //Reset the anwer log (stored questions and the user's answers) back to a blank array.
};

Template.quiz.events({ //Responses to various user 'event's on the 'quiz' page
    'submit #answer': function(event) { //When the <form> with id 'answer' has been submitted (when the user is ready to submit their answer.)
        event.preventDefault(); //Prevent the default action of the submit button (would refresh the page otherwise)
        var userAnswer = event.target.answer.value; //Get the user's answer from the text box and store as userAnswer.
        event.target.answer.value = ''; //Remove text from the text box ready for the next question.
        if (userAnswer.length == 0) { //Check if the user has actually entered anything
            console.log('Empty Input!'); //[DEBUG] log to clientside console that nothing has been inputted
        } else if (userAnswer.match(/[a-z]/i)) { // Check the answer using REGEX whether or not it contains invalid (non numeric) characters
            console.log('Invalid Input!'); //[DEBUG] Log to clientside console that invalid characters have been entered.
        } else if (userAnswer == eval(Session.get('question'))) { //Check if the user's answer is equal to the correct answer
            Session.set('CorrectNum', Session.get('CorrectNum') + 1); //If so, increment the session varaible 'CorrectNum' by 1.
            $('body').removeClass('fadeout').addClass('grn'); //Remove the class 'fadeout' from the <body> (if there was one there before), and add the class 'grn'. This creates the green correct flash effect.
        } else { // If the answer was wrong
            $('body').removeClass('fadeout').addClass('red'); //Remove old 'fadeout' class, then add the 'red' class for the incorrect, red flash.
        }
        setTimeout(function() { //Begin async timer (time below)
            $('body').removeClass('grn').removeClass('red').addClass('fadeout'); //Remove any correct/incorrect classes from the <body> and add the class 'fadeout' to transition back to a white background
        }, 100); //of 100 milliseconds
        addToAnswerLog(Session.get('question'), userAnswer); //Add the question and user answer to the session's answer log.
        if (Session.get('questionNum') >= 10) { //If they have answered 10 questions (finished that quiz)
            Meteor.call('submitAnswers', Session.get('answerLog'), Session.get('CorrectNum'), Meteor.userId(), Meteor.user().username); //Submit the answers to the server, along with the user's account id and username.
            Router.go('results'); //Redirect the browser to the 'results' page.
        } else { //If they haven't finished the quiz...
            nextQuestion(); //Ask the next question.
        }
    }
});

Template.quiz.helpers({ //When the template requests a string (Handlebars {{question}} tag will ask the client to return a string from the helper function 'question').
    'question': function() {
        return Session.get('question'); //Return the session variable 'question'. This puts the generated question on the page and will change when the question does.
    },
    'questionNum': function() {
        return Session.get('questionNum'); //Return the current question number, similar as above.
    },
});

nextQuestion = function(noincrement) { //Clientside plain JavaScript function to generate a new random question
    Meteor.call('generateQuestion', function(err, data) { //Ask the server to generate a question. Because I need this to be syncrounous, a Promise has to be made (by returning err and data vars)
        if (err) { //If there is an error
            console.log(err); //Log it to clientside console
        }
        if (!noincrement) { //If false, the nextQuestion function will not increment the question counter (such as when the page is first displayed and the initial question is generated)
            Session.set('questionNum', Session.get('questionNum') + 1); //Increment the question counter by one.
        }
        Session.set('question', data); //Save the generated question to the Session.
    });
}

addToAnswerLog = function(question, answer) { //Clientside function to add the question and the user's answer to the Session's answer log.
    var array = Session.get('answerLog'); //Get the array initialised on page load, or get whatever data has already been saved.
    array.push([question, answer]); //Push the question and answer to the array
    Session.set('answerLog', array); //Then store the new array back to the Session.
}

//TEMPLATE 'RESULTS' - This is the results page shown at the end of every quiz.

Template.results.helpers({
    'settings': function() { //When the template requests the settings object. This is a settings object used by the Table generation plugin (such as column names)
        var tableData = getTableData(); //Call a function to get the data needed in the table
        return { //Return the following Object
            showFilter: false, //Disable table's filtering (search box) - not needed
            showNavigation: 'never', //Disable table's navigation (not needed, only 10 rows)
            collection: tableData.data, //Data for the table to use.
            showNavigationRowsPerPage: false, //Disable per-page navigation
            rowClass: getRowClass, //Call funciton to get the class for each row, whether it be red (wrong) or green (correct)
            fields: [{ //Settings for each of the column names
                key: '0', //First column
                label: 'Question', //Set column name
                sortable: false //Disable sorting (click to sort - not needed)
            }, {
                key: '1', //Second column
                label: 'Your Answer', //Set column name
                sortable: false //Disable sorting (click to sort - not needed)
            }, {
                key: '2', //Third column
                label: 'Correct Answer', //Set column name
                sortable: false, //Disable sorting (click to sort - not needed)
                hidden: function() { // Hide the column if there are no wrong answers
                    if (tableData.wrongAns == 0) { //If no wrong answers
                        return true; //Hidden will be true
                    } else {
                        return false; //Hidden will be false (not hidden)
                    }
                }
            }]
        };
    }
});

getTableData = function() { //Clientside function to get the data for the table
    var array = Session.get('answerLog'); //Get answer log from Session
    var wrongAns = 0; //Create counter for amount of wrong answers - used to hide/show 'Correct Answer' column.
    for (var i = 0; i < array.length; i++) { //For each item (question/answer) in the answer log
        if (eval(array[i][0]) != array[i][1]) { //If answer given is not the answer to the question
            array[i].push(eval(array[i][0])) //Add a third element to that array with the correct answer (so table will have question, user's answer, and correct answer)
            wrongAns++; //Increment wrong answer counter by 1.
        }
    }
    var tableData = { //Create new object for storing the table data
        data: array, //tableData.data = the answer log with correct answers produced in previous loop
        wrongAns: wrongAns //tableData.wrongAns = number of wrong answers
    };
    return tableData;
}

getRowClass = function(element) { //Generate a class for each row in the table
    if (eval(element[0]) != element[1]) { //If the question doesn't equal the answer
        return "danger"; //Add the 'danger' class (turning that row red). Called danger because that is a bootstrap class
    } else {
        return "success"; //Add the 'success' class (turning that row green).
    }
}

//TEMPLATE 'login' - login page. Shown to user if they aren't logged into an account.

Template.login.events({ //Events for the login page.
    'submit form': function(event) { //When the user submits the login <form>
        event.preventDefault(); //Prevent default submit button behavior (refresh)
        var username = event.target.loginUsername.value; //Get the username given by the user in the loginUsername textbox
        var password = event.target.loginPassword.value; //Get the password given by the user in the loginPassword textbox
        Meteor.loginWithPassword(username, password); //Call the built in Meteor function to login, passing the username and password.
    }
});

//TEMPLATE 'admin' - Teacher's administration page (result viewing, user management, class management)

Template.admin.helpers({
    'newUserFeedback': function() { //Feedback when a new user is created
        return Session.get('newUserFeedback'); //Return session variable set by user creation function
    },
    'moveToGroupFeedback': function() { //Feedback when a user is moved to a different group.
        return Session.get('moveToGroupFeedback') //Return session variable set by group movement function.
    },
    'users': function() { //Template will loop over this object and create a button for each user in the system
        var sort = {}; //Create sort object to be used in the database lookup
        switch (Session.get('usersSortBy')) { //Get value of the sort button on the user management page
            case "NameAsc": //If used wants to sort by username ascending.
                sort = {
                    sort: {
                        username: 1
                    }
                }
                break;
            case "NameDec": //If used wants to sort by username descending.
                sort = {
                    sort: {
                        username: -1
                    }
                }
                break;
            case "AvgScoreAsc": //If used wants to sort by total average score ascnending.
                sort = {
                    sort: {
                        averageScore: 1
                    }
                }
                break;
            case "AvgScoreDec": //If used wants to sort by total average score descending.
                sort = {
                    sort: {
                        averageScore: -1
                    }
                }
                break;
            case "RecAvgScoreAsc": //If used wants to sort by recent (past 3) average score ascending.
                sort = {
                    sort: {
                        recentAverageScore: 1
                    }
                }
                break;
            case "RecAvgScoreDec": //If used wants to sort by recent (past 3) average score descending.
                sort = {
                    sort: {
                        recentAverageScore: -1
                    }
                }
                break;
        }
        return Meteor.users.find({}, sort); //Run the database search, sorting the users by whatever the user selected. This gives Handlebars an object of all the users to iterate over.
    },
    'viewUserUsername': function() {
        return Session.get('viewUser'); //Get the username of the currently selected user in the user management tab.
    },
    'viewUserClass': function() { //Return the class of the currently selected user
        if (Session.get('viewUser') != "No User Selected") { //If a user has been selected...
            return Roles.getRolesForUser(Meteor.users.find({ //(In reverse order) Lookup username in User database, get user object, get user id from object, pass id into getRolesForUser function, return class to Handlebars
                username: Session.get('viewUser')
            }).fetch()[0]._id)[0];
        } else {
            return "-"; //If no user selected, return a "-" to put on the page.
        }
    },
    'viewUserTotalAvg': function() { //Return the total average of the user (all past results)
        if (Session.get('viewUser') != "No User Selected") { //If a user has been selected...
            return Meteor.users.find({ //Lookup username in User database, get the user object, and then get the .averageScore attribute.
                username: Session.get('viewUser')
            }).fetch()[0].averageScore;
        } else {
            return "-"; //If no user selected, return a "-" to put on the page.
        }
    },
    'viewUserRecentAvg': function() { //Return the recent average of the user (past 3 tests)
        if (Session.get('viewUser') != "No User Selected") { //If a user has been selected...
            return Meteor.users.find({ //Lookup username in User database, get the user object, and then get the .reventAverageScore attribute.
                username: Session.get('viewUser')
            }).fetch()[0].recentAverageScore;
        } else {
            return "-"; //If no user selected, return a "-" to put on the page.
        }
    },
    'viewUserClassAvg': function() { //Calculate and return the average score for the class of the selected user.
        if (Session.get('viewUser') != "No User Selected") { //If a user has been selected...
            var role = Roles.getRolesForUser(Meteor.users.find({ //Get the role(group) of the user: Lookup username, get user object, pass _id into getRolesForUser function.
                username: Session.get('viewUser')
            }).fetch()[0]._id)[0];
            var classMembers = Meteor.users.find({ //Find all members of the same group by database lookup, where role = selected user's role.
                roles: role
            }).fetch()
            var totalAvg = 0; //Create var for average. Default 0
            for (var i = 0; i < classMembers.length; i++) { //For each member of the same class
                totalAvg = totalAvg + parseInt(classMembers[i].averageScore) //Add their average score to the total average
            }
            return totalAvg / classMembers.length //Divide total average by number of classmembers to get the class avarage.
        } else {
            return "-"; //If no user selected, return a "-" to put on the page.
        }
    },
    'class1Users': function() { //Return object of all members in Class 1 - used for draggable class management
        return Roles.getUsersInRole('Class 1');
    },
    'class2Users': function() { //Return object of all members in Class 2 - used for draggable class management
        return Roles.getUsersInRole('Class 2');
    },
    'class3Users': function() { //Return object of all members in Class 3 - used for draggable class management
        return Roles.getUsersInRole('Class 3');
    },
    'showClass1state': function() { //Get html class for the Class 1 resutls filtering button - will show button as being depressed/active when clicked.
        if (Session.get('showClass1')) { //If button has been pressed (see actual event below)
            return 'active'; //Return the string 'active', which will be added to the class of the button, and CSS will work its magic.
        } else {
            return null;
        }
    },
    'showClass2state': function() { //Get html class for the Class 2 resutls filtering button - will show button as being depressed/active when clicked.
        if (Session.get('showClass2')) { //If button has been pressed (see actual event below)
            return 'active'; //Return the string 'active', which will be added to the class of the button, and CSS will work its magic
        } else {
            return null;
        }
    },
    'showClass3state': function() { //Get html class for the Class 3 resutls filtering button - will show button as being depressed/active when clicked.
        if (Session.get('showClass3')) { //If button has been pressed (see actual event below)
            return 'active'; //Return the string 'active', which will be added to the class of the button, and CSS will work its magic
        } else {
            return null;
        }
    },
    'resultsSortByLabel': function() { //Return the currently selected filtering mode, used as the text on the sort by dropdown.
        if (Session.get('resultsSortByLabel') == null) { //If no selection mode has been selected
            return "Sort By" //Display the text 'Sort By' on the button/dropdown
        } else {
            return Session.get('resultsSortByLabel'); //Else, show the currently selected sorting mode on the button.
        }
    },
    'usersSortByLabel': function() { //Same as above, but on the Users page.
        if (Session.get('usersSortByLabel') == null) {
            return "Sort By"
        } else {
            return Session.get('usersSortByLabel');
        }
    },
    'results': function() { //This is a complicated one - returns an object containing all the results, with filtering applied.
        var criteria = {} //Blank object for the data search criteria.
        var usernameArray = [] //Blank array for the list of usernames entered in the username search box.
        if (Session.get('filterText') != null) { //If the user has entered something into the search box...
            for (var i = 0; i < Session.get('filterText').split(',').length; i++) { //For each username entered (comma delimited)
                usernameArray.push({
                    username: Session.get('filterText').split(',')[i].trim() //Trim the whitespace and add that username to the array of usernames to show.
                });
            }
            criteria.$or = usernameArray; //Set the mongo selector $or to the usernames we want. See https://docs.mongodb.org/manual/reference/operator/query/ for more information.
        }
        var sort = {} //New object to set the sorting preferences in.
        switch (Session.get('resultsSortBy')) { //Get the chosen sorting mode and apply the corresponding sorting object to each case.
            case "ScoreAsc":
                sort = {
                    sort: {
                        correct: 1
                    }
                }
                break;
            case "ScoreDec":
                sort = {
                    sort: {
                        correct: -1
                    }
                }
                break;
            case "DateAsc":
                sort = {
                    sort: {
                        date: 1
                    }
                }
                break;
            case "DateDec":
                sort = {
                    sort: {
                        date: -1
                    }
                }
                break;
            case "NameAsc":
                sort = {
                    sort: {
                        username: 1
                    }
                }
                break;
            case "NameDec":
                sort = {
                    sort: {
                        username: -1
                    }
                }
                break;
        }
        var data = Data.find(criteria, sort).fetch() //Perform the search against the database using the criteria (usernames) and sorting preferences.
        for (var i = data.length - 1; i >= 0; i--) { //For each element (result) in the returned object. Loop runs in reverse so splices don't ruin everything (by changing object length)
            data[i].class = Roles.getRolesForUser(data[i].userId)[0]; //Get the class for the user who completed that quiz
            if (!Session.get('showClass1') && data[i].class == "Class 1") { //If the user has filtered out members of Class 1
                data.splice(i, 1); //Remove the element from the object.
            } else if (!Session.get('showClass2') && data[i].class == "Class 2") { //If the user has filtered out members of Class 2
                data.splice(i, 1); //Remove the element from the object.
            } else if (!Session.get('showClass3') && data[i].class == "Class 3") { //If the user has filtered out members of Class 3
                data.splice(i, 1); //Remove the element from the object.
            }
        }
        return convertResults(data, false); //Pass the results onto the convertResults function (so the table works) and then return to the template to be viewed.
    },
    'dateconv': function(ldate) { //Handlebars funciton to convert full date and time into a more readable date/time (d/m/y hh:mm:am/pm)
        var dateobj = new Date(ldate) //Create new date from input
        return moment(dateobj).format("l LT") //Format date into the more readable version and return
    },
    'progChart': function() { //Helper to return the settings for the progress chart - see EOF.
        return progChartSettings();
    },
    'viewUserResults': function() { //Return the recent results
        return convertResults(Data.find({ //Perform database lookup for selected user's results, but limit results to most recent 3.
            username: Session.get('viewUser')
        }, {
            limit: 3
        }).fetch(), true);
    },
    'buttonDisabled': function() { //Return HTML string for use in button classes. Shows button as disabled when no used is selected.
        if (Session.get('viewUser') == "No User Selected") {
            return "disabled"
        } else {
            return ""
        }
    }
});

Template.admin.events({ //WARNING - NOT HUGELY WELL ORGANISED - DIFFERENT EVENTS FOR DIFFERENTS TABS IN A RANDOM ORDER.
    'submit #new-user-form': function(e, t) { //When the user creation form has been submitted...
        e.preventDefault(); //Prevent default submit button behavior (refresh)
        var username = t.find('#account-username').value; //Get username from textbox
        var password = t.find('#account-password').value; //Get password from textbox
        if (username.length < 1) { //Check if username has actually been entered.
            Session.set('newUserFeedback', 'You must provide a valid username.') //If not, tell them to
            return false;
        } else if (password.length < 1) { //Check if password has actually been entered.
            Session.set('newUserFeedback', 'You must provide a valid password.') //If not, tell them to.
            return false;
        }
        Meteor.call('createNewUser', username, password, function(error) { //If username and password given, call server function to create the new user from the given data. Create a promise so feedback can be given.
            if (error) {
                Session.set('newUserFeedback', error.reason); //If there was an error (e.g. duplicate username), set the feedback (returned through Helper) with the error.
            } else {
                t.find('#account-username').value = null; //Clear the textboxes
                t.find('#account-password').value = null;
                Session.set('newUserFeedback', 'New user created successfully.'); //Tell them the new user was made successfully
            }
        });
    },
    'click .btn-norounded': function(e, t) { //If the user clicks one of the users listed on the user management page.
        Session.set('viewUser', event.target.textContent) //Set the session variable to the username - this will populate the user information sheet.
    },
    'click #showClass1': function(e, t) { //If the user wants to show/hide Class 1's results
        if (Session.get('showClass1')) { //If already being shown
            Session.set('showClass1', false); //Hide
        } else { //If already being hidden
            Session.set('showClass1', true); //Show
        }
    },
    'click #showClass2': function(e, t) { //See above
        if (Session.get('showClass2')) {
            Session.set('showClass2', false);
        } else {
            Session.set('showClass2', true);
        }
    },
    'click #showClass3': function(e, t) { //See above
        if (Session.get('showClass3')) {
            Session.set('showClass3', false);
        } else {
            Session.set('showClass3', true);
        }
    },
    'click #resultsSortScoreAsc': function(e, t) { //When the user selects a sorting method (e.g. by score ascending)
        Session.set('resultsSortByLabel', "Score <span class='glyphicon glyphicon-chevron-up'>") //Set the sort button label to be the chosen method, and the associated arrow glyphicon
        Session.set('resultsSortBy', "ScoreAsc"); //Set the Session var for that sort method
    },
    'click #resultsSortScoreDec': function(e, t) { //See above
        Session.set('resultsSortByLabel', "Score <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('resultsSortBy', "ScoreDec");
    },
    'click #resultsSortDateAsc': function(e, t) { //See above
        Session.set('resultsSortBy', "Date <span class='glyphicon glyphicon-chevron-up'>")
        Session.set('resultsSortBy', "DateAsc");
    },
    'click #resultsSortDateDec': function(e, t) { //See above
        Session.set('resultsSortByLabel', "Date <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('resultsSortBy', "DateDec");
    },
    'click #resultsSortNameAsc': function(e, t) { //See above
        Session.set('resultsSortByLabel', "Name <span class='glyphicon glyphicon-chevron-up'>")
        Session.set('resultsSortBy', "NameAsc");
    },
    'click #resultsSortNameDec': function(e, t) { //See above
        Session.set('resultsSortByLabel', "Name <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('resultsSortBy', "NameDec");
    },
    'click #usersSortAvgScoreAsc': function(e, t) { //See above
        Session.set('usersSortByLabel', "Total Average <span class='glyphicon glyphicon-chevron-up'>")
        Session.set('usersSortBy', "AvgScoreAsc");
    },
    'click #usersSortAvgScoreDec': function(e, t) { //See above
        Session.set('usersSortByLabel', "Total Average <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('usersSortBy', "AvgScoreDec");
    },
    'click #usersSortRecAvgScoreAsc': function(e, t) { //See above
        Session.set('usersSortByLabel', "Recent Average <span class='glyphicon glyphicon-chevron-up'>")
        Session.set('usersSortBy', "RecAvgScoreAsc");
    },
    'click #usersSortRecAvgScoreDec': function(e, t) { //See above
        Session.set('usersSortByLabel', "Recent Average <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('usersSortBy', "RecAvgScoreDec");
    },
    'click #usersSortNameAsc': function(e, t) { //See above
        Session.set('usersSortByLabel', "Name <span class='glyphicon glyphicon-chevron-up'>")
        Session.set('usersSortBy', "NameAsc");
    },
    'click #usersSortNameDec': function(e, t) { //See above
        Session.set('usersSortByLabel', "Name <span class='glyphicon glyphicon-chevron-down'>")
        Session.set('usersSortBy', "NameDec");
    },
    'keyup #filterText': function(e, t) { //After every keystroke in the username filtering box (live results)
        if (t.find('#filterText').value == "") { //If the textbox is empty
            Session.set('filterText', null); //Set the filter to be null
        } else {
            Session.set('filterText', t.find('#filterText').value); //Else, set a Session var to that text
        }
    },
    'click #filterTextClear': function(e, t) { //If the user presses the textbox clear button
        t.find('#filterText').value = ""; //Set the textbox text emtpy
        Session.set('filterText', null); //Clear the filteirng Session var
    },
    'click #moveToTeacher': function() { //If the user selects a dropdown option to move the user to a different group
        Meteor.call('moveUserToRole', Session.get('viewUser'), "teacher"); //Call the sever function to move the user and pass the username and desired role
    },
    'click #moveToClass1': function() { //See above
        Meteor.call('moveUserToRole', Session.get('viewUser'), "Class 1");
    },
    'click #moveToClass2': function() { //See above
        Meteor.call('moveUserToRole', Session.get('viewUser'), "Class 2");
    },
    'click #moveToClass3': function() { //See above
        Meteor.call('moveUserToRole', Session.get('viewUser'), "Class 3");
    },
    'click #deleteUser': function() { //If the user clicks the 'Delete User' button
        if (Session.get('viewUser') != "No User Selected") { //If a user has been selected (disabled button still triggers 'clicked' event)
            BootstrapModalPrompt.prompt({ //Create a warning popup using the Bootstrap Modal Prompt plugin
                title: "Delete User?", //Warning box title
                content: "Are you sure you want to delete the user: " + Session.get('viewUser') //Warning box text
            }, function(result) {
                if (result) { //If they click yes/ok
                    Meteor.call('deleteUser', Session.get('viewUser')); //Run the server function to delete the user, passing the username
                    Session.set('viewUser', "No User Selected"); //Clear the currently selected user, as it has been deleteted
                    Session.set('progChartData', null); //Clear the progress chart data, as the user has been deleted.
                }
            });
        }
    },
    'submit #change-password-form': function(e, t) { //When the user submits the change password dropdown form
        e.preventDefault(); //Prevent the default submit behavior (refresh)
        Meteor.call('changeUserPassword', Meteor.users.find({ //Call the Server method to change a user's password, passing the id of the user (DB username lookup), and the textbox value.
            username: Session.get('viewUser')
        }).fetch()[0]._id, t.find('#change-password').value);
        $('#changePasswordButton').click(); //Emulate clicking of the dropdown button to hide the form again.
        t.find('#change-password').value = ""; //Reset the textbox.
    }
});

Template.admin.created = function() { //When the admin page is first called, resets any selected users.
    Session.set('viewUser', "No User Selected");
    Session.set('progChartData', null); //Clear the progress chart data.
}

Template.userDrag.rendered = function(e, t) {
    $(document).ready(function() { //After Handlebars has populated the DOM with each user in the class management page
        $('.sortable1, .sortable2, .sortable3').sortable({ //Run the sortable plugin on each class, so users can be dragged between classes.
            connectWith: '.connected', //Connect each class together so users can be dragged between them.
            items: ':not(.disabled)' //Any item without the .disabled class can be dragged (so call the users, but not the headings)
        }).bind('sortupdate', function(e, ui) {
            Meteor.call('moveUserToRole', ui.item[0]['textContent'], ui.endparent[0]['outerText'].split("\n")[0]); //After user has finished moving users between classes, call the Server function to moveUserToRole, passing the username and the target group.
        });
    })
}


//TEMPLATE 'PASTRESULTS'

Template.pastresults.helpers({
    'dates': function() { //Return each result the user has saved to the database
        var data = Data.find({ //Serach database for current user's id.
            userId: Meteor.userId()
        }, {
            sort: {
                date: -1 //Sort by date (most recent first)
            }
        }, {
            fields: { //Only returns needed fields (q1-10, date, correct)
                date: 1,
                correct: 1,
                q1: 1,
                q2: 1,
                q3: 1,
                q4: 1,
                q5: 1,
                q6: 1,
                q7: 1,
                q8: 1,
                q9: 1,
                q10: 1
            }
        }).fetch();
        return convertResults(data, true); //Run the data through the convertResults (See EOF) function and return
    },
    'dateconv': function(ldate) { //Same as above - converts long date into easily read.
        var dateobj = new Date(ldate)
        return moment(dateobj).format("l LT")
    },
    'progChart': function() { //Same as above - returns settings object (See EOF) for the Progress Chart.
        return progChartSettings();
    }
});

Handlebars.registerHelper('settings', function(correct) { //Slightly different helper - this is registered by Handlebars so I can pass arguments from the template rather than the JS.
    return { //Returns settings for table - see above.
        showFilter: false,
        showNavigation: 'never',
        showNavigationRowsPerPage: false,
        rowClass: getRowClass,
        fields: [{
            key: '0',
            label: 'Question',
            sortable: false
        }, {
            key: '1',
            label: 'Your Answer',
            sortable: false
        }, {
            key: '2',
            label: 'Correct Answer',
            sortable: false,
            hidden: function() {
                if (correct == 10) {
                    return true;
                } else {
                    return false;
                }
            }
        }]
    }
});

//DEBUG TEMPLATES

Template.debug.events({
    'submit #generatedata': function(e, t) { //[DEBUG] Runs a data generation function server-side to populate a user with random results
        e.preventDefault(); //Prevent default submit behavior (refresh)
        var username = t.find('#generatedata-user').value; //Get target username
        var score = t.find('#generatedata-score').value; //Get chosen score
        if (username.length < 1) { //Check if a username has been entered
            return false;
        }
        Meteor.call('generateUserData', username, score); //Pass data to server function generateUserData.
    }
});

function convertResults(data, setProgData) { //Another complicated one - converts data stored in the database into a format readable by the reactiveTable plugin
    var wrongAns = []; //Create empty array to store wrong answers.
    for (var i = 0; i < data.length; i++) { //For each object passed in (each question and user's answer)
        wrongAns.push(0); //Push a 0 to the wrongAns array - will stay as 0 if correct, or will be incremented to 1 later if incorrect.
        for (var j = 0; j < 10; j++) { //For each question in the quiz
            if (eval(eval("data[" + i + "].q" + (j + 1) + "[0]")) != eval(eval("data[" + i + "].q" + (j + 1) + "[1]"))) { //Compare the question and answer (using evals because the questions are stored using static vartiable names (q1-10), and evaling allows me to iterate over variable names.)
                eval("data[" + i + "].q" + (j + 1)).push(eval(eval("data[" + i + "].q" + (j + 1) + "[0]"))); //If incorrect, push the correct answer into the object (as a third element)
                wrongAns[i]++; //And increment the wrongAns array to 1.
            } else {
                eval("data[" + i + "].q" + (j + 1)).push(null); //If correct, push a null as the third element
            }
        }
    }
    var dataObj = []; //Begin constructing the final object that will be returned. Will have .data, .username, .class, .correct, and .date. This packages all the information needed into one object to be passed into the template.
    var numCorrect = []; //Create a blank numCorrect array. Will have the number correct out of 10 for each quiz result.
    for (var i = 0; i < wrongAns.length; i++) { //for each quiz
        numCorrect.push(10 - wrongAns[i]); //Calculate the score out of 10
    }
    if (setProgData) { //If we want to store this data in the Session to be accessed by the Progress Chart
        Session.set('progChartData', numCorrect); //Store in Session
    }
    for (var i = 0; i < data.length; i++) { //For each quiz
        dataObj.push({ //Push all the data about that quiz into a new element
            'date': data[i].date, //Date of quiz
            'username': data[i].username, //User who completed quiz
            'class': data[i].class, //Class of user who completed quiz.
            'correct': (10 - wrongAns[i]), //Score out of 10 for that quiz.
            'data': [ //Store the question, answer, and correct answer under data. Quite ugly, but it works!
                [data[i].q1[0], data[i].q1[1], data[i].q1[2]],
                [data[i].q2[0], data[i].q2[1], data[i].q2[2]],
                [data[i].q3[0], data[i].q3[1], data[i].q3[2]],
                [data[i].q4[0], data[i].q4[1], data[i].q4[2]],
                [data[i].q5[0], data[i].q5[1], data[i].q5[2]],
                [data[i].q6[0], data[i].q6[1], data[i].q6[2]],
                [data[i].q7[0], data[i].q7[1], data[i].q7[2]],
                [data[i].q8[0], data[i].q8[1], data[i].q8[2]],
                [data[i].q9[0], data[i].q9[1], data[i].q9[2]],
                [data[i].q10[0], data[i].q10[1], data[i].q10[2]]
            ]
        });
    }
    return dataObj;
}

function progChartSettings() { //Settings for the progress chart.
    return {
        title: {
            text: '' //Disable title
        },
        xAxis: {
            allowDecimals: false, //Disable non integers
            lineColor: 'transparent', //Disable x-axis
            gridLineWidth: 0, //Disable x-axis
            minorGridLineWidth: 0, //Disable x-axis
            reversed: true, //Reverse (upside down otherwise)
            tickInterval: 1, //Disable x-axis
            minorTickLength: 0,
            tickLength: 0,
            title: {
                text: '' //Disable x-axis title
            },
            labels: {
                enabled: false, //Disable labels
            }
        },
        yAxis: { //Same as x-axis
            allowDecimals: false,
            lineColor: 'transparent',
            gridLineWidth: 0,
            minorGridLineWidth: 0,
            tickInterval: 1,
            minorTickLength: 0,
            tickLength: 0,
            title: {
                text: ''
            },
            labels: {
                enabled: false,
            },
            min: -1,
            max: 11
        },
        credits: {
            enabled: false //Disable author credits
        },
        tooltip: {
            enabled: false //Disable tooltip
        },
        plotOptions: {
            series: {
                allowPointSelect: false, //Disable point selection
                marker: {
                    enabled: false //Disable dots at each plot point
                },
                states: {
                    hover: {
                        enabled: false //Disable hover effect
                    }
                }
            }
        },
        series: [{
            showInLegend: false, //Disable legend
            type: 'spline', //Spline chart type (smooth)
            data: Session.get('progChartData'), //Get chart data from Session var
            color: {
                linearGradient: [0, 0, 0, 300], //Colour gradient darker at the bottom
                stops: [
                    [0, '#27A20B'], //Gradient
                    [1, '#C50D22']
                ]
            }
        }]
    }
}
