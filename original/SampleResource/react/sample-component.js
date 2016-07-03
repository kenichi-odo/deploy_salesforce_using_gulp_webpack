import React from 'react';
import Classname from 'classnames';

export default class SampleComponent extends React.Component
{
	constructor( props_ )
	{
		super( props_ );
		this.state = props_;
	}

	componentWillReceiveProps( props_ )
	{
		this.setState( props_ );
	}

	render()
	{
		if ( this.state.items.length === 0 ) {
			return null;
		}

		return (
			<div style={ { display: 'table' } }>
				{
					this.state.items.map( item_ => {
						return (
							<div key={ item_.id } style={ { display: 'table-row' } }>
								<div className={ Classname( { 'hoge-style': item_.name === 'hoge' } ) } style={ { display: 'table-cell' } }>
									{ item_.name }
								</div>
							</div>
						);
					} )
				}
			</div>
		);
	}
}
