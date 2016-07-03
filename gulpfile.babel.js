// Force.comのログインユーザ名とパスワードの設定
process.env.SF_USERNAME = '';
process.env.SF_PASSWORD = '';

// moduleのロード
import gulp from 'gulp';
import file from 'gulp-file';
import { exec } from 'child_process';
import webpack from 'webpack-stream';
import zip from 'gulp-zip';
import deploy from 'gulp-jsforce-deploy';
import metadata from 'salesforce-metadata-xml-builder';
import os from 'os';
import precss from 'precss';

// ターミナルからgulpを実行した時の処理
gulp.task( 'default', () => {

	// original配下のファイルを監視する
	gulp.watch( './original/**/*' ).on( 'change', event => {

		// Windows or Macのファイル区切り文字
		const split_str = os.type().toString().match( 'Windows' ) !== null ? '\\' : '/';

		// デプロイ時の静的リソース名
		// ファイル更新した際の属するフォルダ名(original直下のフォルダ名)を設定
		let resource_name = null;

		// デプロイ時のパス設定
		const paths = [];
		let end_flg = false;
		for ( const path of event.path.split( split_str ) ) {
			if ( end_flg ) {
				paths.push( path );
				resource_name = path;
				break;
			}

			if ( path === 'original' ) {
				end_flg = true;
			}
			paths.push( path );
		}

		// 静的リソースのメタデータ作成
		const resource_meta_xml = metadata.StaticResource( {
			cacheControl: 'Public',
			contentType: 'application/zip',
		} );

		// デプロイ用package.xmlの作成
		const package_xml = metadata.Package( {
			types: [
				{ name: 'StaticResource', members: [resource_name] },
			],
			version: '35.0',
		} );

		// ビルドするmain.js
		const entry = `${ paths.join( split_str ) }/main.js`;

		// ビルド開始をMacの通知センターに流す
		exec( `echo \'display notification "ビルド開始: ${ resource_name }" with title "gulp" subtitle "webpack"\' | osascript` );

		// webpackのビルド
		gulp.src( entry )
			.pipe( webpack( {
				entry,
				output: {
					filename: 'bundle.js',
					libraryTarget: 'umd', // ライブラリとして出力
					library: `${ resource_name }`, // windowにフォルダ名で書きだして呼び出せるようにする
				},
				devtool: 'inline-source-map', // ビルドしたjsをデバッグできるようにsource mapをインラインで埋め込み
				module: {
					loaders: [
						{
							test: /(\.js)$/,
							loaders: ['babel'],
							exclude: /node_modules/,
						},
						{
							test: /\.sass$/,
							loaders: ['style', 'css', 'postcss?parser=sugarss'],
						},
					],
				},
				postcss: [precss],
			} ) )
			.on( 'error', () => {
				// webpackのビルドでエラー時、デプロイせずエラーを通知
				exec( `echo \'display notification "ビルドエラー: ${ resource_name }" with title "gulp" subtitle "webpack"\' | osascript` );
			} )
			.pipe( gulp.dest( `./build/${ resource_name }` ) ) // webpackでビルドしたbundle.jsをbuildフォルダに格納
			.on( 'finish', () => {
				// ビルドの終了を通知
				exec( `echo \'display notification "ビルド終了: ${ resource_name }" with title "gulp" subtitle "webpack"\' | osascript` );

				// zip圧縮→デプロイ
				gulp.src( `./build/${ resource_name }/*` )
					.pipe( zip( `${ resource_name }.resource` ) )
					.pipe( file( `${ resource_name }.resource-meta.xml`, resource_meta_xml ) )
					.pipe( gulp.dest( './src/staticresources' ) )
					.on( 'finish', () => {

						// zip圧縮が完了したらデプロイ開始通知
						exec(
							`echo \'display notification "デプロイ開始: ${ resource_name }.resource" with title "gulp" subtitle "Salesforce"\' | osascript`
						);

						// デプロイ処理
						gulp.src( './src/**', { base: '.' } )
							.pipe( file( 'src/package.xml', package_xml ) )
							.pipe( zip( 'pkg.zip' ) )
							.pipe( deploy( {
								username: process.env.SF_USERNAME,
								password: process.env.SF_PASSWORD,
								loginUrl: 'https://test.salesforce.com',
							} ) )
							.on( 'finish', () => {

								// デプロイが完了したら通知を流す
								exec(
									`echo \'display notification "デプロイ完了: ${ resource_name }.resource" with title "gulp" subtitle "Salesforce"\' | osascript`
								);
							} );
					} );
			} );
	} );
} );
