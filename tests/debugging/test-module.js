require.config({
	jquery: {
		path: 'http://code.jquery.com/jquery-2.1.4.min',
		styles: [
			'test-styles'
		]
	}
});


require(['test-module'], function() {
	console.log('done...');
});


define('test-module', ['jquery'], function(jquery) {
	console.log('test-module defined');
});
