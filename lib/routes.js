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
})
Router.route('/userlist', function(){
  this.render('userlist');
})
