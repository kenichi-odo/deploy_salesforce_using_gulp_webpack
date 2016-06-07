// Force.comのログインユーザ名とパスワードの設定
process.env.SF_USERNAME = '';
process.env.SF_PASSWORD = '';

// moduleのロード
var gulp = require( 'gulp' );
var webpack = require( 'gulp-webpack' );
var zip = require( 'gulp-zip' );
var jsforce = require( 'gulp-jsforce-deploy' );

// ターミナルからgulp watchを実行した時、
// main.jsの変更を監視する
gulp.task( 'watch', function() {

	// 変更があったらデプロイ開始
    gulp.watch( 'main.js', ['deploy'] );
} );

// デプロイをする前にwebpackでビルドする
gulp.task( 'deploy', ['webpack'], function() {

	// loginUrlは適宜書き換えてください
	gulp.src( './pkg/**', { base: "." } )
		.pipe( zip( 'pkg.zip' ) )
		.pipe( jsforce( {
			username: process.env.SF_USERNAME,
			password: process.env.SF_PASSWORD,
			loginUrl: 'https://test.salesforce.com'
		} ) );
} );

// ビルドした後、Test配下のbundle.jsとbundle.js.mapをzipにし、
// staticresources内に格納する
gulp.task( 'webpack', ['build'], function() {
	return gulp.src( './build/Test/*' ).pipe( zip( 'Test.resource' ) ).pipe( gulp.dest( 'pkg/staticresources' ) );
} );

// webpackを実行しmain.jsをjQuery使用可能にしたbundle.jsに変換
// デバッグできるようにsource mapを吐き出す
// returnで処理を同期
gulp.task( 'build', function() {
	return gulp.src( 'main.js' ).pipe(
		webpack( {
			entry: './main.js',
			output: {
				filename: 'bundle.js'
			},
			devtool: 'source-map'
		} )
	).pipe( gulp.dest( './build/Test' ) );
} );