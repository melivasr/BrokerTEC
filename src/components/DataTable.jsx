import React from 'react';

const DataTable = ({ title, data }) => (
	<div>
		<h3>{title}</h3>
		<pre>{JSON.stringify(data, null, 2)}</pre>
	</div>
);

export default DataTable;
