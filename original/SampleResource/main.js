import './style/main.sass';
import $ from 'jquery';
import React from 'react';
import ReactDom from 'react-dom';
import SampleComponent from './react/sample-component';

export class Main
{
	constructor( name_ )
	{
		this._name = name_;

		this._$sample_component_div = $( '<div />' );
		$( '#contents_area' ).append( this._$sample_component_div );
	}

	load()
	{
		const items = [{
			id: '001',
			name: 'hoge',
		}, {
			id: '002',
			name: 'fuga',
		}];

		ReactDom.render( <SampleComponent items={ items } />, this._$sample_component_div.get( 0 ) );

		alert( this._name );
	}
}
