Router.route('/', function(){
  this.render('main-menu');
});
Router.route('/quiz', function(){
  this.render('quiz');
});
Router.route('/results', function(){
  this.render('results');
});
