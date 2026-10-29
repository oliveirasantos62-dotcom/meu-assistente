export default function Distractions({ buy }) {
  const distractions = [
    [120, '🎬 1 episódio'],
    [150, '🎮 1h jogo'],
    [80, '📱 30min redes'],
  ];

  return (
    <div className='distraction'>
      <strong>🎮 Banco de distrações</strong>

      {distractions.map(([price, name]) => (
        <div className='daily-row' key={name}>
          <span>{name}</span>

          <button onClick={() => buy(price, name)}>{price} 🪙</button>
        </div>
      ))}
    </div>
  );
}
