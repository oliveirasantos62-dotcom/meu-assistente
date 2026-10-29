export default function GameBar({ xp, coins, level, progress }) {
  return (
    <div className='gamebar'>
      <div className='gamebox'>
        <strong>⭐ {xp} XP</strong>

        <div className='progress'>
          <span
            style={{
              width: progress + '%',
            }}
          />
        </div>

        <small>{level * 100 - xp} XP para o próximo nível</small>
      </div>

      <div className='gamebox level'>
        🏆 Nível <strong>{level}</strong>
      </div>

      <div className='gamebox coins'>
        🪙 <strong>{coins}</strong> moedas
      </div>
    </div>
  );
}
