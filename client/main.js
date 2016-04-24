Data = new Mongo.Collection("data");
Meteor.subscribe("data");
Meteor.subscribe("userList");

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});

//TEMPLATE 'QUIZ'

Template.quiz.rendered = function() {
    if (!Meteor.user()) {
        Router.go('login');
    }
    if (!this.rendered) {
        this._rendered = true;
        nextQuestion(true);
        Session.set('newUserFeedback', '');
    }
    Session.set('questionNum', 1);
    Session.set('CorrectNum', 0);
    Session.set('answerLog', []);
};

Template.quiz.events({
    'click #nq': function() {
        nextQuestion();
    },
    'submit #answer': function(event) {
        event.preventDefault();
        var userAnswer = event.target.answer.value;
        event.target.answer.value = '';
        if (userAnswer.length == 0) {
            console.log('Empty Input!');
        } else if (userAnswer.match(/[a-z]/i)) {
            console.log('Invalid Input!');
        } else if (userAnswer == eval(Session.get('question'))) {
            Session.set('CorrectNum', Session.get('CorrectNum') + 1);
            $('body').removeClass('fadeout').addClass('grn');
        } else {
            $('body').removeClass('fadeout').addClass('red');
        }
        setTimeout(function() {
            $('body').removeClass('grn').removeClass('red').addClass('fadeout');
        }, 100);
        addToAnswerLog(Session.get('question'), userAnswer);
        if (Session.get('questionNum') >= 10) {
            Meteor.call('submitAnswers', Session.get('answerLog'), Session.get('CorrectNum'), Meteor.userId(), Meteor.user().username);
            Router.go('results');
        } else {
            nextQuestion();
        }
    }
});

Template.quiz.helpers({
    'question': function() {
        return Session.get('question');
    },
    'questionNum': function() {
        return Session.get('questionNum');
    },
});

nextQuestion = function(noincrement) {
    Meteor.call('generateQuestion', function(err, data) {
        if (err) {
            console.log(err);
        }
        if (!noincrement) {
            Session.set('questionNum', Session.get('questionNum') + 1);
        }
        Session.set('question', data);
    });
}

addToAnswerLog = function(var1, var2) {
    var array = Session.get('answerLog');
    array.push([var1, var2]);
    Session.set('answerLog', array);
}

//TEMPLATE 'RESULTS'

Template.results.helpers({
    'settings': function() {
        var tableData = getTableData();
        return {
            showFilter: false,
            showNavigation: 'never',
            collection: tableData.data,
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
                    if (tableData.wrongAns == 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }]
        };
    }
});

getTableData = function() {
    var array = Session.get('answerLog');
    var wrongAns = 0;
    for (var i = 0; i < array.length; i++) {
        if (eval(array[i][0]) != array[i][1]) {
            array[i].push(eval(array[i][0]))
            wrongAns++;
        }
    }
    var tableData = {
        data: array,
        wrongAns: wrongAns
    };
    console.log(tableData);
    return tableData;
}

getRowClass = function(element) {
    if (eval(element[0]) != element[1]) {
        return "danger";
    } else {
        return "success";
    }
}

Template.login.rendered = function() {
        this.$('.dropdown-toggle').remove();
        this.$('.dropdown-menu').show();
    }
    //TEMPLATE 'ADMIN'

Template.admin.helpers({
    'newUserFeedback': function() {
        return Session.get('newUserFeedback');
    },
    'moveToGroupFeedback': function() {
        return Session.get('moveToGroupFeedback')
    },
    'class1Users': function() {
        return Roles.getUsersInRole('Class 1')
    },
    'class2Users': function() {
        return Roles.getUsersInRole('Class 2')
    },
    'class3Users': function() {
        return Roles.getUsersInRole('Class 3')
    }
});

Template.admin.events({
    //TODO MOVE ERRORS TO CLOUD
    'submit #new-user-form': function(e, t) {
        e.preventDefault();
        var username = t.find('#account-username').value;
        var password = t.find('#account-password').value;
        var role = t.find('#account-role').value;
        if (username.length < 1) {
            Session.set('newUserFeedback', 'You must provide a valid username.')
                //TODO further username validation
            return false;
        } else if (password.length < 1) {
            Session.set('newUserFeedback', 'You must provide a valid password.')
                //TODO further password validation
            return false;
        } else if (role.length < 1) {
            Session.set('newUserFeedback', 'You must set a role for this user.')
            return false;
        }
        Meteor.call('createNewUser', username, password, role, function(error) {
            if (error) {
                Session.set('newUserFeedback', error.reason);
            } else {
                t.find('#account-username').value = null;
                t.find('#account-password').value = null;
                Session.set('newUserFeedback', 'New user created successfully.');
            }
        });
    },
    'submit #move-user-form': function(e, t) {
        e.preventDefault();
        var username = t.find('#move-username').value;
        var role = t.find('#move-role').value;
        Meteor.call('moveUserToRole', username, role);
    }
});

Template.admin.rendered = function() {
    $(document).ready(function() {
        $('.sortable1, .sortable2, .sortable3').sortable({
            connectWith: '.connected',
            items: ':not(.disabled)'
        });
    })
}

//TEMPLATE 'PASTRESULTS'

Template.pastresults.helpers({
    'dates': function() {
        var data = Data.find({
            userId: Meteor.userId()
        }, {
            sort: {
                date: -1
            }
        }, {
            fields: {
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
        var wrongAns = [];
        for (var i = 0; i < data.length; i++) {
            wrongAns.push(0);
            for (var j = 0; j < 10; j++) {
                if (eval(eval("data[" + i + "].q" + (j + 1) + "[0]")) != eval(eval("data[" + i + "].q" + (j + 1) + "[1]"))) {
                    eval("data[" + i + "].q" + (j + 1)).push(eval(eval("data[" + i + "].q" + (j + 1) + "[0]")));
                    wrongAns[i]++;
                } else {
                    eval("data[" + i + "].q" + (j + 1)).push(null);
                }
            }
        }
        var dataObj = [];
        var numCorrect = [];
        for (var i = 0; i < wrongAns.length; i++) {
            numCorrect.push(10 - wrongAns[i]);
        }
        Session.set('correctdat', numCorrect);
        for (var i = 0; i < data.length; i++) {
            dataObj.push({
                'date': data[i].date,
                'correct': (10 - wrongAns[i]),
                'data': [
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
    },
    'dateconv': function(ldate) {
        var dateobj = new Date(ldate)
        return moment(dateobj).format("l LT")
    },
    'progChart': function() {
        return {
            title: {
                text: ''
            },
            xAxis: {
                allowDecimals: false,
                lineColor: 'transparent',
                gridLineWidth: 0,
                minorGridLineWidth: 0,
                reversed: true,
                tickInterval: 1,
                minorTickLength: 0,
                tickLength: 0,
                title: {
                    text: ''
                },
                labels: {
                    enabled: false,
                }
            },
            yAxis: {
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
                enabled: false
            },
            tooltip: {
                enabled: false
            },
            plotOptions: {
                series: {
                    allowPointSelect: false,
                    marker: {
                        enabled: false
                    },
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
            series: [{
                showInLegend: false,
                type: 'spline',
                data: Session.get('correctdat'),
                color: {
                    linearGradient: [0, 0, 0, 300],
                    stops: [
                        [0, '#27A20B'],
                        [1, '#C50D22']
                    ]
                }
            }]
        }
    }
});

Handlebars.registerHelper('settings', function(correct) {
    return {
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

Template.debug.helpers({});

Template.debug.events({
    'submit #generatedata': function(e, t) {
        e.preventDefault();
        var username = t.find('#generatedata-user').value;
        var score = t.find('#generatedata-score').value;
        if (username.length < 1) {
            return false;
        }
        Meteor.call('generateUserData', username, score);
    }
});

function generateQuestionlocal() {
    var maxQuestionNumber = 10;
    var minQuestionNumber = 1;
    var questionPart1 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
    var questionPart2 = Math.floor(Math.random() * (maxQuestionNumber - minQuestionNumber + 1) + minQuestionNumber);
    var rndbool = Math.random() >= 0.5;
    if (rndbool) {
        return (questionPart1 + " + " + questionPart2);
    } else {
        return (questionPart1 + " - " + questionPart2);
    }
}
