// Router.onBeforeAction(function () {
// // all properties available in the route function
// // are also available here such as this.params
//
//   if (!Meteor.userId()) {
//     // if the user is not logged in, render the Login template
//     this.render('Login');
//   } else {
//     // otherwise don't hold up the rest of hooks or our route/action function
//     // from running
//     this.next();
//   }
// });

Router.route('/', function(){
  this.render('main-menu');
});
Router.route('/quiz', function(){
  this.render('quiz');
});
Router.route('/results', function(){
  this.render('results');
});
Router.route('/pastresults', function(){
  this.render('pastresults');
});
Router.route('/login', function(){
  this.render('login');
});
Router.route('/admin', function(){
  this.render('admin');
});
Router.route('/debug', function(){
  this.render('debug');
});
