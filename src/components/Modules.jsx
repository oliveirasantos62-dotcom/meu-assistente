export default function Modules({ selected, onSelect }) {
  const modules = [
    ['💻', 'Programação'],
    ['❤️', 'Saúde'],
    ['📚', 'Estudos'],
    ['💰', 'Finanças'],
    ['🚀', 'Projetos'],
    ['🧭', 'Rotina'],
  ];

  return (
    <div className='modules'>
      {modules.map(([icon, name]) => (
        <div
          className={'module ' + (selected === name ? 'selected' : '')}
          key={name}
          onClick={() => onSelect(name)}
        >
          <span>{icon}</span>

          <strong>{name}</strong>

          <small>
            {name === 'Finanças'
              ? 'Carteira • Metas • Gastos'
              : 'Seu espaço pessoal'}
          </small>
        </div>
      ))}
    </div>
  );
}
