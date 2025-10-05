import React from 'react';

const ModalConfirm = ({ title, message, onConfirm, onCancel }) => (
	<div style={{ background: '#fff', border: '1px solid #ccc', padding: 20 }}>
		<h4>{title}</h4>
		<p>{message}</p>
		<button onClick={() => onConfirm('Justificación')}>Confirmar</button>
		<button onClick={onCancel}>Cancelar</button>
	</div>
);

export default ModalConfirm;
