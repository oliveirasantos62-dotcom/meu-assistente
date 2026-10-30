import React, { useEffect, useMemo, useState } from 'react';
import {
  createInvestment,
  deleteInvestment,
  getInvestmentDashboard,
  migrateLocalInvestments,
  saveInvestmentSnapshot,
  updateInvestment,
} from '../services/api';
import { storageService } from '../services/storage';

const API_BASE = 'https://brapi.dev/api/quote';

const TYPES = ['Ações', 'FIIs', 'Cripto', 'Renda Fixa'];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatPercent = (value) => {
  const number = Number(value || 0);

  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`;
};

const today = () => new Date().toISOString().slice(0, 10);

const getAssetValue = (investment) =>
  Number(investment.quantity || 0) *
  Number(investment.currentPrice || investment.buyPrice || 0);

const getInvestedValue = (investment) =>
  Number(investment.quantity || 0) * Number(investment.buyPrice || 0);

export default function Investments({ data, save }) {
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState('Ações');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [remoteReady, setRemoteReady] = useState(false);

  const investments = data?.investments || [];

  useEffect(() => {
    let cancelled = false;

    async function loadRemote() {
      try {
        const local = storageService.loadData(localStorage.getItem('meu-assistente-user') ? JSON.parse(localStorage.getItem('meu-assistente-user')).email : null) || {};
        const remote = await getInvestmentDashboard();

        if (!remote.investments?.length && Array.isArray(local.investments) && local.investments.length) {
          await migrateLocalInvestments({
            investments: local.investments,
            portfolioHistory: local.portfolioHistory || [],
            targetAllocation: local.targetAllocation,
          });
          const migrated = await getInvestmentDashboard();
          if (!cancelled) {
            save({ ...data, investments: migrated.investments || [], portfolioHistory: migrated.portfolioHistory || [], targetAllocation: migrated.targetAllocation || data.targetAllocation });
          }
        } else if (!cancelled) {
          save({ ...data, investments: remote.investments || [], portfolioHistory: remote.portfolioHistory || [], targetAllocation: remote.targetAllocation || data.targetAllocation });
        }
        if (!cancelled) setRemoteReady(true);
      } catch (err) {
        console.error('Erro ao carregar investimentos da nuvem:', err);
        if (!cancelled) {
          setError(err.message || 'Não foi possível carregar seus investimentos.');
          setRemoteReady(false);
        }
      }
    }

    loadRemote();
    return () => { cancelled = true; };
  }, []);

  const allocation = investments.reduce((acc, item) => {
    const type = item.type || 'Outros';
    const value = getAssetValue(item);
    acc[type] = (acc[type] || 0) + value;
    return acc;
  }, {});

  const portfolioTotal = Object.values(allocation).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  );

  const targetAllocation = data?.targetAllocation || {
    'Ações': 60,
    'FIIs': 20,
    'Renda Fixa': 20,
    'Cripto': 0,
  };

  /*
   * =========================================================
   * COTAÇÃO
   * =========================================================
   */

  const fetchRealPrice = async (symbol) => {
    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) return null;

    try {
      const response = await fetch(
        `${API_BASE}/${encodeURIComponent(cleanSymbol)}`,
      );

      if (!response.ok) {
        throw new Error('Falha ao consultar a cotação.');
      }

      const apiData = await response.json();

      const result = apiData?.results?.[0];

      if (!result) {
        return null;
      }

      const price = Number(result.regularMarketPrice);

      return Number.isFinite(price) && price > 0 ? price : null;
    } catch (err) {
      console.error('Erro ao consultar cotação:', err);
      return null;
    }
  };

  /*
   * =========================================================
   * HISTÓRICO DA CARTEIRA
   * =========================================================
   */

  const savePortfolioSnapshot = (investmentList) => {
    const date = today();

    const total = investmentList.reduce(
      (sum, investment) => sum + getAssetValue(investment),
      0,
    );

    const invested = investmentList.reduce(
      (sum, investment) => sum + getInvestedValue(investment),
      0,
    );

    const history = data.portfolioHistory || [];

    const existing = history.find((item) => item.date === date);

    let updatedHistory;

    const snapshot = {
      date,
      invested,
      value: total,
      profit: total - invested,
    };

    if (existing) {
      updatedHistory = history.map((item) =>
        item.date === date ? snapshot : item,
      );
    } else {
      updatedHistory = [...history, snapshot];
    }

    return updatedHistory
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365);
  };

  /*
   * =========================================================
   * ADICIONAR ATIVO
   * =========================================================
   */

  const handleAddInvestment = async () => {
    setError('');
    setMessage('');

    const symbol = ticker.trim().toUpperCase();
    const q = Number(quantity);
    const bPrice = Number(buyPrice);

    if (!symbol) return setError('Informe o ticker do ativo.');
    if (!Number.isFinite(q) || q <= 0) return setError('Informe uma quantidade válida.');
    if (!Number.isFinite(bPrice) || bPrice <= 0) return setError('Informe um preço de compra válido.');

    setLoading(true);
    try {
      const realPrice = await fetchRealPrice(symbol);
      const currentPrice = realPrice ?? bPrice;
      const created = await createInvestment({ ticker: symbol, type, quantity: q, buyPrice: bPrice, currentPrice });
      const updatedInvestments = [...investments, created];
      const history = savePortfolioSnapshot(updatedInvestments);
      const savedHistory = await saveInvestmentSnapshot(history[history.length - 1]);
      save({ ...data, investments: updatedInvestments, portfolioHistory: savedHistory, xp: (data.xp || 0) + 20, coins: (data.coins || 0) + 10 });
      setTicker(''); setQuantity(''); setBuyPrice('');
      setMessage(realPrice ? `${symbol} adicionado. Cotação atualizada.` : `${symbol} adicionado usando o preço de compra como referência.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao salvar investimento.');
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================================
   * ATUALIZAR UM ATIVO
   * =========================================================
   */

  const refreshInvestment = async (investment) => {
    setError(''); setMessage(''); setLoadingTicker(investment.ticker);
    try {
      const realPrice = await fetchRealPrice(investment.ticker);
      if (realPrice === null) throw new Error(`Não foi possível atualizar ${investment.ticker}.`);
      const updated = await updateInvestment(investment.id, { currentPrice: realPrice });
      const updatedInvestments = investments.map(item => item.id === investment.id ? updated : item);
      const history = savePortfolioSnapshot(updatedInvestments);
      const savedHistory = await saveInvestmentSnapshot(history[history.length - 1]);
      save({ ...data, investments: updatedInvestments, portfolioHistory: savedHistory });
      setMessage(`${investment.ticker} atualizado com sucesso.`);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar investimento.');
    } finally { setLoadingTicker(''); }
  };

  /*
   * =========================================================
   * ATUALIZAR TODA A CARTEIRA
   * =========================================================
   */

  const refreshAllPrices = async () => {
    if (!investments.length) return setError('Sua carteira está vazia.');
    setError(''); setMessage(''); setLoading(true);
    try {
      const updatedInvestments = [];
      for (const investment of investments) {
        const realPrice = await fetchRealPrice(investment.ticker);
        if (realPrice === null) updatedInvestments.push(investment);
        else updatedInvestments.push(await updateInvestment(investment.id, { currentPrice: realPrice }));
      }
      const history = savePortfolioSnapshot(updatedInvestments);
      const savedHistory = await saveInvestmentSnapshot(history[history.length - 1]);
      save({ ...data, investments: updatedInvestments, portfolioHistory: savedHistory });
      setMessage('Carteira atualizada.');
    } catch (err) {
      setError(err.message || 'Erro ao atualizar carteira.');
    } finally { setLoading(false); }
  };

  /*
   * =========================================================
   * EXCLUIR
   * =========================================================
   */

  const removeInvestment = async (id) => {
    const investment = investments.find((item) => item.id === id);
    if (!investment) return;
    if (!window.confirm(`Excluir ${investment.ticker} da carteira?`)) return;
    try {
      await deleteInvestment(id);
      const updatedInvestments = investments.filter(item => item.id !== id);
      const history = savePortfolioSnapshot(updatedInvestments);
      const savedHistory = history.length ? await saveInvestmentSnapshot(history[history.length - 1]) : [];
      save({ ...data, investments: updatedInvestments, portfolioHistory: savedHistory });
      setMessage(`${investment.ticker} removido.`);
    } catch (err) {
      setError(err.message || 'Erro ao excluir investimento.');
    }
  };

  /*
   * =========================================================
   * CÁLCULOS
   * =========================================================
   */

  const stats = useMemo(() => {
    const totalInvested = investments.reduce(
      (sum, investment) => sum + getInvestedValue(investment),
      0,
    );

    const totalCurrentValue = investments.reduce(
      (sum, investment) => sum + getAssetValue(investment),
      0,
    );

    const totalProfitLoss = totalCurrentValue - totalInvested;

    const totalProfitLossPct =
      totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    const winners = investments.filter(
      (investment) => getAssetValue(investment) > getInvestedValue(investment),
    );

    const losers = investments.filter(
      (investment) => getAssetValue(investment) < getInvestedValue(investment),
    );

    const bestAsset = investments.length
      ? [...investments].sort((a, b) => {
          const aInvested = getInvestedValue(a);
          const bInvested = getInvestedValue(b);

          const aPct =
            aInvested > 0
              ? ((getAssetValue(a) - aInvested) / aInvested) * 100
              : 0;

          const bPct =
            bInvested > 0
              ? ((getAssetValue(b) - bInvested) / bInvested) * 100
              : 0;

          return bPct - aPct;
        })[0]
      : null;

    const worstAsset = investments.length
      ? [...investments].sort((a, b) => {
          const aInvested = getInvestedValue(a);
          const bInvested = getInvestedValue(b);

          const aPct =
            aInvested > 0
              ? ((getAssetValue(a) - aInvested) / aInvested) * 100
              : 0;

          const bPct =
            bInvested > 0
              ? ((getAssetValue(b) - bInvested) / bInvested) * 100
              : 0;

          return aPct - bPct;
        })[0]
      : null;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPct,
      winners,
      losers,
      bestAsset,
      worstAsset,
    };
  }, [investments]);

  /*
   * =========================================================
   * DISTRIBUIÇÃO POR TIPO
   * =========================================================
   */

  const distributionByType = useMemo(() => {
    const groups = {};

    investments.forEach((investment) => {
      const type = investment.type || 'Outros';

      groups[type] = (groups[type] || 0) + getAssetValue(investment);
    });

    return Object.entries(groups)
      .map(([type, value]) => ({
        type,
        value,
        percentage:
          stats.totalCurrentValue > 0
            ? (value / stats.totalCurrentValue) * 100
            : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [investments, stats.totalCurrentValue]);

  /*
   * =========================================================
   * HISTÓRICO
   * =========================================================
   */

  const portfolioHistory = data.portfolioHistory || [];

  const historyMax = Math.max(
    1,
    ...portfolioHistory.map((item) => Number(item.value) || 0),
  );

  return (
    <div className='card investments-page'>
      <style>{`
        .investments-page { --invest-grid: rgba(125, 130, 155, .22); --invest-dot: #fff; }
        .investments-page .section-title { align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .investments-page .section-title h2 { font-size: clamp(1.35rem, 2.4vw, 1.9rem); letter-spacing: -.04em; margin-bottom: 6px; }
        .investments-page .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .investments-page .reward { border: 1px solid var(--invest-grid); border-radius: 16px; padding: 18px; background: linear-gradient(145deg, rgba(117,103,248,.09), rgba(34,184,167,.035)); min-width: 0; }
        .investments-page .reward strong { display: block; font-size: clamp(1rem, 1.7vw, 1.45rem); letter-spacing: -.035em; overflow-wrap: anywhere; }
        .investments-page .reward small { display: block; margin-top: 7px; opacity: .75; }
        .invest-panel { margin-top: 18px; padding: clamp(16px, 2.2vw, 24px); border: 1px solid var(--invest-grid); border-radius: 20px; background: linear-gradient(145deg, rgba(117,103,248,.055), rgba(34,184,167,.025)); overflow: hidden; }
        .invest-panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
        .invest-panel-heading h3 { margin: 5px 0 4px; font-size: 1.1rem; letter-spacing: -.025em; }
        .invest-panel-heading p { margin: 0; font-size: .88rem; opacity: .68; }
        .invest-eyebrow { font-size: .68rem; font-weight: 800; letter-spacing: .14em; color: #8276ff; }
        .invest-chart-badge { white-space: nowrap; font-size: .75rem; font-weight: 700; padding: 7px 10px; border-radius: 999px; background: rgba(117,103,248,.12); color: #8a80ff; }
        .invest-empty-chart { min-height: 175px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 22px; border: 1px dashed var(--invest-grid); border-radius: 15px; }
        .invest-empty-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; font-size: 1.5rem; color: #8276ff; background: rgba(117,103,248,.13); margin-bottom: 10px; }
        .invest-empty-chart strong { margin-bottom: 5px; }
        .invest-empty-chart p { max-width: 390px; margin: 0; font-size: .85rem; opacity: .68; }
        .invest-line-chart-wrap { width: 100%; }
        .invest-chart-summary { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .invest-chart-summary strong { font-size: clamp(1.4rem, 3vw, 2rem); letter-spacing: -.05em; }
        .invest-chart-summary span, .invest-chart-axis { font-size: .76rem; opacity: .65; }
        .invest-line-chart { display: block; width: 100%; height: auto; overflow: visible; }
        .invest-chart-axis { display: flex; justify-content: space-between; margin: 4px 18px 0; }
        .invest-allocation-layout { display: grid; grid-template-columns: minmax(210px, 270px) minmax(0, 1fr); gap: clamp(22px, 3vw, 36px); align-items: center; max-width: 980px; margin: 0 auto; }
        .invest-donut { width: min(100%, 240px); aspect-ratio: 1; border-radius: 50%; padding: 16px; margin: auto; display: grid; place-items: center; box-shadow: 0 12px 35px rgba(0,0,0,.22); }
        .invest-donut-hole { width: 100%; height: 100%; border-radius: 50%; background: #171b2b; color: #f5f6ff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 12px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
        .invest-donut-hole span { color: #aeb5cf; font-size: .75rem; opacity: 1; }
        .invest-donut-hole strong { max-width: 100%; margin-top: 6px; color: #ffffff; font-size: clamp(.95rem, 1.5vw, 1.25rem); letter-spacing: -.04em; overflow-wrap: anywhere; }
        .invest-legend { display: grid; gap: 4px; min-width: 0; }
        .invest-legend-item { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--invest-grid); }
        .invest-legend-item:last-child { border-bottom: 0; }
        .invest-legend-dot { width: 9px; height: 9px; border-radius: 4px; }
        .invest-legend-label { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .invest-legend-label strong { font-size: .9rem; }
        .invest-legend-label small { font-size: .76rem; opacity: .65; }
        .invest-legend-item > b { font-size: .9rem; font-variant-numeric: tabular-nums; }
        .investments-page .investment-row { border: 1px solid var(--invest-grid); border-radius: 14px; padding: 14px; gap: 12px; margin-bottom: 9px; }
        .investments-page .investment-row > button { flex-shrink: 0; }
        @media (max-width: 760px) {
          .investments-page .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .invest-allocation-layout { grid-template-columns: 1fr; gap: 18px; }
          .invest-donut { width: min(70vw, 230px); }
          .invest-legend { width: 100%; }
        }
        @media (max-width: 480px) {
          .investments-page .reward { padding: 13px; }
          .investments-page .investment-row { flex-wrap: wrap; }
          .investments-page .investment-row > div:first-child { flex-basis: calc(100% - 8px); }
        }
      `}</style>
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className='section-title'>
        <div>
          <h2>💰 Carteira de Investimentos</h2>

          <p className='subtitle'>
            Acompanhe patrimônio, rentabilidade, distribuição e evolução.
          </p>
        </div>

        <button className='ghost' onClick={refreshAllPrices} disabled={loading}>
          {loading ? '🔄 Atualizando...' : '🔄 Atualizar carteira'}
        </button>
      </div>

      {/* =====================================================
          MENSAGENS
      ===================================================== */}

      {message && (
        <div
          className='focus'
          style={{
            marginBottom: 14,
            color: '#217764',
          }}
        >
          ✅ {message}
        </div>
      )}

      {error && (
        <div
          className='focus'
          style={{
            marginBottom: 14,
            color: '#9b3434',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <div className='metrics'>
        <div className='reward'>
          <strong>{formatMoney(stats.totalInvested)}</strong>
          <small>Capital investido</small>
        </div>

        <div className='reward'>
          <strong>{formatMoney(stats.totalCurrentValue)}</strong>
          <small>Valor atual</small>
        </div>

        <div className='reward'>
          <strong
            style={{
              color: stats.totalProfitLoss >= 0 ? '#217764' : '#9b3434',
            }}
          >
            {formatMoney(stats.totalProfitLoss)}
          </strong>

          <small>{formatPercent(stats.totalProfitLossPct)}</small>
        </div>

        <div className='reward'>
          <strong>{investments.length}</strong>
          <small>Ativos</small>
        </div>
      </div>

      {/* =====================================================
          MELHOR / PIOR
      ===================================================== */}

      {investments.length > 0 && (
        <div className='metrics' style={{ marginTop: 12 }}>
          <div className='reward'>
            <strong>🏆 {stats.bestAsset?.ticker || '—'}</strong>

            <small>Melhor desempenho</small>
          </div>

          <div className='reward'>
            <strong>⚠️ {stats.worstAsset?.ticker || '—'}</strong>

            <small>Pior desempenho</small>
          </div>

          <div className='reward'>
            <strong>{stats.winners.length}</strong>
            <small>Ativos positivos</small>
          </div>

          <div className='reward'>
            <strong>{stats.losers.length}</strong>
            <small>Ativos negativos</small>
          </div>
        </div>
      )}

      {/* =====================================================
          EVOLUÇÃO PATRIMONIAL
      ===================================================== */}

      <div className='invest-panel invest-evolution'>
        <div className='invest-panel-heading'>
          <div>
            <span className='invest-eyebrow'>DESEMPENHO</span>
            <h3>📈 Evolução patrimonial</h3>
            <p>Histórico dos valores registrados na sua carteira.</p>
          </div>
          <span className='invest-chart-badge'>{portfolioHistory.length} registros</span>
        </div>

        {portfolioHistory.length < 2 ? (
          <div className='invest-empty-chart'>
            <div className='invest-empty-icon'>↗</div>
            <strong>Seu gráfico está começando</strong>
            <p>Registre atualizações em dias diferentes para acompanhar a evolução do patrimônio.</p>
          </div>
        ) : (
          <div className='invest-line-chart-wrap'>
            {(() => {
              const values = portfolioHistory.map((item) => Number(item.value) || 0);
              const minValue = Math.min(...values) * 0.96;
              const maxValue = Math.max(...values) * 1.04 || 1;
              const range = maxValue - minValue || 1;
              const width = 720;
              const height = 240;
              const points = values.map((value, index) => {
                const x = 18 + (index / Math.max(values.length - 1, 1)) * (width - 36);
                const y = height - 22 - ((value - minValue) / range) * (height - 48);
                return { x, y, value, item: portfolioHistory[index] };
              });
              const line = points.map((point) => `${point.x},${point.y}`).join(' ');
              const area = `18,${height - 22} ${line} ${width - 18},${height - 22}`;
              const last = points[points.length - 1];
              return (
                <>
                  <div className='invest-chart-summary'>
                    <strong>{formatMoney(last.value)}</strong>
                    <span>Último registro · {new Date(last.item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                  <svg className='invest-line-chart' viewBox={`0 0 ${width} ${height}`} role='img' aria-label='Gráfico de evolução patrimonial'>
                    <defs>
                      <linearGradient id='investAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#6d5dfc' stopOpacity='.28' />
                        <stop offset='100%' stopColor='#6d5dfc' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((grid) => {
                      const y = 18 + grid * ((height - 40) / 3);
                      return <line key={grid} x1='18' x2={width - 18} y1={y} y2={y} stroke='var(--invest-grid)' strokeDasharray='4 6' />;
                    })}
                    <polygon points={area} fill='url(#investAreaGradient)' />
                    <polyline points={line} fill='none' stroke='#7567f8' strokeWidth='4' strokeLinecap='round' strokeLinejoin='round' />
                    {points.map((point, index) => (
                      <circle key={point.item.date + index} cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 3.5} fill={index === points.length - 1 ? '#7567f8' : 'var(--invest-dot)'} stroke='#fff' strokeWidth='2'>
                        <title>{`${point.item.date}: ${formatMoney(point.value)}`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className='invest-chart-axis'>
                    <span>{new Date(portfolioHistory[0].date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span>{new Date(portfolioHistory[portfolioHistory.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* =====================================================
          DISTRIBUIÇÃO POR ATIVO
      ===================================================== */}

      <div className='focus' style={{ marginTop: 18 }}>
        <strong>📊 Distribuição por ativo</strong>

        {investments.length === 0 ? (
          <p className='subtitle'>
            Adicione ativos para visualizar sua distribuição.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
              marginTop: 12,
            }}
          >
            {investments.map((investment) => {
              const value = getAssetValue(investment);

              const percentage =
                stats.totalCurrentValue > 0
                  ? (value / stats.totalCurrentValue) * 100
                  : 0;

              return (
                <div key={investment.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                      fontSize: 13,
                    }}
                  >
                    <strong>{investment.ticker}</strong>

                    <span>
                      {percentage.toFixed(1)}% · {formatMoney(value)}
                    </span>
                  </div>

                  <div className='progress' style={{ height: 8 }}>
                    <span
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          DISTRIBUIÇÃO POR TIPO
      ===================================================== */}

      <div className='invest-panel'>
        <div className='invest-panel-heading'>
          <div>
            <span className='invest-eyebrow'>ALOCAÇÃO</span>
            <h3>🧩 Distribuição por classe</h3>
            <p>Veja como o valor atual está dividido entre categorias.</p>
          </div>
        </div>

        {distributionByType.length === 0 ? (
          <div className='invest-empty-chart'>
            <div className='invest-empty-icon'>◌</div>
            <strong>Nenhuma classe para mostrar</strong>
            <p>Adicione ativos à carteira para montar o gráfico de alocação.</p>
          </div>
        ) : (
          <div className='invest-allocation-layout'>
            <div
              className='invest-donut'
              style={{
                background: `conic-gradient(${distributionByType.map((item, index) => {
                  const colors = ['#7567f8', '#22b8a7', '#f5a623', '#ef6687', '#4d91f7', '#a66cf5'];
                  const start = distributionByType.slice(0, index).reduce((sum, previous) => sum + previous.percentage, 0);
                  return `${colors[index % colors.length]} ${start}% ${start + item.percentage}%`;
                }).join(', ')})`,
              }}
              role='img'
              aria-label='Gráfico de rosca da distribuição por classe'
            >
              <div className='invest-donut-hole'>
                <span>Patrimônio</span>
                <strong>{formatMoney(stats.totalCurrentValue)}</strong>
              </div>
            </div>
            <div className='invest-legend'>
              {distributionByType.map((item, index) => {
                const colors = ['#7567f8', '#22b8a7', '#f5a623', '#ef6687', '#4d91f7', '#a66cf5'];
                return (
                  <div className='invest-legend-item' key={item.type}>
                    <span className='invest-legend-dot' style={{ background: colors[index % colors.length] }} />
                    <div className='invest-legend-label'>
                      <strong>{item.type}</strong>
                      <small>{formatMoney(item.value)}</small>
                    </div>
                    <b>{item.percentage.toFixed(1)}%</b>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          NOVO ATIVO
      ===================================================== */}

      <div className='focus' style={{ marginTop: 18 }}>
        <strong>➕ Registrar novo ativo</strong>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            marginTop: 12,
          }}
        >
          <input
            placeholder='Ticker: PETR4'
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
          />

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type='number'
            min='0'
            step='any'
            placeholder='Quantidade'
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />

          <input
            type='number'
            min='0'
            step='0.01'
            placeholder='Preço médio'
            value={buyPrice}
            onChange={(event) => setBuyPrice(event.target.value)}
          />
        </div>

        <button
          className='primary'
          onClick={handleAddInvestment}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 12,
          }}
        >
          {loading ? '🔄 Consultando cotação...' : 'Adicionar à carteira'}
        </button>

        <small
          style={{
            display: 'block',
            marginTop: 8,
            color: 'var(--site-text-muted)',
          }}
        >
          A cotação atual será buscada automaticamente quando disponível.
        </small>
      </div>

      {/* =====================================================
          ALOCAÇÃO DA CARTEIRA
      ===================================================== */}

      <div className='focus investment-focus' style={{ marginTop: 18 }}>
        <div className='investment-section-title'>
          <div>
            <strong>🎯 Alocação da carteira</strong>
            <small>Compare sua distribuição atual com a meta configurada.</small>
          </div>
          <strong>{formatMoney(portfolioTotal)}</strong>
        </div>

        {portfolioTotal > 0 ? (
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {['Ações', 'FIIs', 'Renda Fixa', 'Cripto'].map((typeName) => {
              const value = Number(allocation[typeName] || 0);
              const currentPct = (value / portfolioTotal) * 100;
              const targetPct = Number(targetAllocation[typeName] || 0);
              const difference = currentPct - targetPct;

              return (
                <div key={typeName}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                    <strong>{typeName}</strong>
                    <span>
                      {currentPct.toFixed(1)}% · meta {targetPct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--site-border)', borderRadius: 999, overflow: 'hidden', marginTop: 5 }}>
                    <div
                      style={{
                        width: `${Math.min(100, currentPct)}%`,
                        height: '100%',
                        background: 'var(--site-primary)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <small style={{ color: 'var(--site-text-muted)' }}>
                    {difference > 0 ? '+' : ''}{difference.toFixed(1)} p.p. vs. meta
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className='subtitle'>Adicione ativos para visualizar a distribuição.</p>
        )}
      </div>

      {/* =====================================================
          LISTA DE ATIVOS
      ===================================================== */}

      <div style={{ marginTop: 20 }}>
        <h3>📋 Minha carteira</h3>

        {investments.length === 0 && (
          <p className='subtitle'>Nenhum ativo cadastrado.</p>
        )}

        {investments.map((investment) => {
          const invested = getInvestedValue(investment);
          const current = getAssetValue(investment);

          const profit = current - invested;

          const profitPct = invested > 0 ? (profit / invested) * 100 : 0;

          const isUpdating = loadingTicker === investment.ticker;

          return (
            <div className='task investment-row' key={investment.id}>
              <div style={{ flex: 1 }}>
                <strong>{investment.ticker}</strong>

                <span className='tag' style={{ marginLeft: 6 }}>
                  {investment.type}
                </span>

                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--site-text-muted)',
                    marginTop: 5,
                  }}
                >
                  {investment.quantity} un. · PM{' '}
                  {formatMoney(investment.buyPrice)}
                  {' · '}
                  Atual{' '}
                  {formatMoney(investment.currentPrice || investment.buyPrice)}
                </div>

                {investment.updatedAt && (
                  <small
                    style={{
                      display: 'block',
                      marginTop: 3,
                      color: 'var(--site-text-muted)',
                    }}
                  >
                    Atualizado em{' '}
                    {new Date(investment.updatedAt).toLocaleString('pt-BR')}
                  </small>
                )}
              </div>

              <div
                style={{
                  textAlign: 'right',
                  minWidth: 130,
                }}
              >
                <strong>{formatMoney(current)}</strong>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: profit >= 0 ? '#217764' : '#9b3434',
                  }}
                >
                  {formatPercent(profitPct)}
                </div>
              </div>

              <button
                className='ghost'
                onClick={() => refreshInvestment(investment)}
                disabled={isUpdating || loading}
                title='Atualizar cotação'
              >
                {isUpdating ? '🔄' : '↻'}
              </button>

              <button
                className='ghost'
                onClick={() => removeInvestment(investment.id)}
                title='Excluir ativo'
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          AVISO
      ===================================================== */}

      <div
        className='focus'
        style={{
          marginTop: 18,
          fontSize: 12,
        }}
      >
        ℹ️ As cotações dependem da disponibilidade da fonte externa. Os valores
        exibidos são apenas para acompanhamento e não constituem recomendação de
        investimento.
      </div>
    </div>
  );
}
