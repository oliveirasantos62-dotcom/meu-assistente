import React, { useMemo, useState } from 'react';
import TagPicker from './TagPicker';

const EXPENSE_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Educação',
  'Saúde',
  'Lazer',
  'Assinaturas',
  'Compras',
  'Contas',
  'Impostos',
  'Outros',
];

const INCOME_CATEGORIES = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Negócio',
  'Benefícios',
  'Outros',
];

const PAYMENT_METHODS = [
  'Pix',
  'Débito',
  'Crédito',
  'Dinheiro',
  'Transferência',
  'Boleto',
  'Outro',
];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatPercent = (value) => {
  const number = Number(value || 0);

  return `${number >= 0 ? '+' : ''}${number.toFixed(1)}%`;
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getCurrentDate = () => new Date().toISOString().slice(0, 10);

function normalizeTransaction(transaction) {
  return {
    id: transaction.id || Date.now() + Math.random(),
    type: transaction.type === 'income' ? 'income' : 'expense',
    description: transaction.description || '',
    category: transaction.category || 'Outros',
    amount: Number(transaction.amount) || 0,
    date: transaction.date || getCurrentDate(),
    paymentMethod: transaction.paymentMethod || 'Outro',
    fixed: Boolean(transaction.fixed),
    paid: transaction.paid !== false,
    notes: transaction.notes || '',
    createdAt: transaction.createdAt || new Date().toISOString(),
  };
}

function normalizeFinance(finance) {
  return {
    transactions: Array.isArray(finance?.transactions)
      ? finance.transactions.map(normalizeTransaction)
      : [],
    monthlyBudget: Number(finance?.monthlyBudget) || 0,
    savingsGoal: Number(finance?.savingsGoal) || 0,
    creditLimit: Number(finance?.creditLimit) || 0,
    currentBalance: Number(finance?.currentBalance) || 0,
    salary: Number(finance?.salary) || 0,
    financialGoals: Array.isArray(finance?.financialGoals)
      ? finance.financialGoals
      : [],
  };
}

export default function FinanceSystem({ data, save }) {
  const finance = normalizeFinance(data?.finance);

  const transactions = finance.transactions;

  const [month, setMonth] = useState(getCurrentMonth());

  const [transactionType, setTransactionType] = useState('expense');

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [fixed, setFixed] = useState(false);
  const [transactionTags, setTransactionTags] = useState([]);

  const [monthlyBudget, setMonthlyBudget] = useState(
    finance.monthlyBudget ? String(finance.monthlyBudget) : '',
  );

  const [salary, setSalary] = useState(
    finance.salary ? String(finance.salary) : '',
  );

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);

  /*
   * =========================================================
   * TRANSAÇÕES DO MÊS
   * =========================================================
   */

  const monthTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.date?.slice(0, 7) === month)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, month]);

  /*
   * =========================================================
   * CÁLCULOS
   * =========================================================
   */

  const stats = useMemo(() => {
    const income = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenses = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const balance = income - expenses;

    const fixedExpenses = monthTransactions
      .filter(
        (transaction) => transaction.type === 'expense' && transaction.fixed,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const variableExpenses = monthTransactions
      .filter(
        (transaction) => transaction.type === 'expense' && !transaction.fixed,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const paidExpenses = monthTransactions
      .filter(
        (transaction) => transaction.type === 'expense' && transaction.paid,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const pendingExpenses = monthTransactions
      .filter(
        (transaction) => transaction.type === 'expense' && !transaction.paid,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      income,
      expenses,
      balance,
      fixedExpenses,
      variableExpenses,
      paidExpenses,
      pendingExpenses,
      savingsRate,
    };
  }, [monthTransactions]);

  /*
   * =========================================================
   * CATEGORIAS
   * =========================================================
   */

  const categoryStats = useMemo(() => {
    const groups = {};

    monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        groups[transaction.category] =
          (groups[transaction.category] || 0) + transaction.amount;
      });

    return Object.entries(groups)
      .map(([categoryName, value]) => ({
        category: categoryName,
        value,
        percentage: stats.expenses > 0 ? (value / stats.expenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, stats.expenses]);

  /*
   * =========================================================
   * SALVAR
   * =========================================================
   */

  const persistFinance = (nextFinance, successMessage = '') => {
    save({
      ...data,
      finance: nextFinance,
    });

    if (successMessage) {
      setMessage(successMessage);
    }

    setError('');
  };

  /*
   * =========================================================
   * ADICIONAR / EDITAR
   * =========================================================
   */

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(getCurrentDate());
    setPaymentMethod('Pix');
    setFixed(false);
    setTransactionTags([]);
    setEditingId(null);
  };

  const handleSubmit = () => {
    setError('');
    setMessage('');

    const cleanDescription = description.trim();
    const value = Number(amount);

    if (!cleanDescription) {
      setError('Informe uma descrição.');
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    if (!date) {
      setError('Informe a data.');
      return;
    }

    if (editingId) {
      const updatedTransactions = transactions.map((transaction) =>
        transaction.id === editingId
          ? {
              ...transaction,
              type: transactionType,
              description: cleanDescription,
              category,
              amount: value,
              date,
              paymentMethod,
              fixed,
              tags: Array.from(new Set(transactionTags.map(String))),
            }
          : transaction,
      );

      persistFinance(
        {
          ...finance,
          transactions: updatedTransactions,
        },
        'Transação atualizada.',
      );

      resetForm();
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type: transactionType,
      description: cleanDescription,
      category,
      amount: value,
      date,
      paymentMethod,
      fixed,
      tags: Array.from(new Set(transactionTags.map(String))),
      paid: true,
      createdAt: new Date().toISOString(),
    };

    persistFinance(
      {
        ...finance,
        transactions: [...transactions, newTransaction],
      },
      'Transação adicionada.',
    );

    resetForm();
  };

  /*
   * =========================================================
   * EDITAR
   * =========================================================
   */

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setTransactionType(transaction.type);
    setDescription(transaction.description);
    setCategory(transaction.category);
    setAmount(String(transaction.amount));
    setDate(transaction.date);
    setPaymentMethod(transaction.paymentMethod);
    setFixed(transaction.fixed);
    setTransactionTags(Array.isArray(transaction.tags) ? transaction.tags.map(String) : []);

    setMessage('');
    setError('');

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  /*
   * =========================================================
   * EXCLUIR
   * =========================================================
   */

  const removeTransaction = (id) => {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${transaction.description}"?`);

    if (!confirmed) {
      return;
    }

    const updatedTransactions = transactions.filter((item) => item.id !== id);

    persistFinance(
      {
        ...finance,
        transactions: updatedTransactions,
      },
      'Transação removida.',
    );
  };

  /*
   * =========================================================
   * MARCAR COMO PAGA
   * =========================================================
   */

  const togglePaid = (transaction) => {
    const updatedTransactions = transactions.map((item) =>
      item.id === transaction.id
        ? {
            ...item,
            paid: !item.paid,
          }
        : item,
    );

    persistFinance({
      ...finance,
      transactions: updatedTransactions,
    });
  };

  /*
   * =========================================================
   * ORÇAMENTO
   * =========================================================
   */

  const saveFinancialSettings = () => {
    const budget = Number(monthlyBudget) || 0;
    const salaryValue = Number(salary) || 0;

    persistFinance(
      {
        ...finance,
        monthlyBudget: budget,
        salary: salaryValue,
      },
      'Planejamento financeiro atualizado.',
    );
  };

  const budgetUsed =
    finance.monthlyBudget > 0
      ? (stats.expenses / finance.monthlyBudget) * 100
      : 0;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className='card'>
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className='investment-header'>
        <div>
          <div className='section-label'>FINANÇAS · VIDA FINANCEIRA</div>

          <h2>💰 Finanças</h2>

          <p className='subtitle'>
            Organize sua renda, gastos, orçamento, contas e evolução financeira
            em um só lugar.
          </p>
        </div>

        <div className='investment-header-actions'>
          <label>
            <span>Mês</span>

            <input
              type='month'
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
        </div>
      </div>

      {/* =====================================================
          MENSAGENS
      ====================================================== */}

      {message && (
        <div className='investment-alert investment-alert-success'>
          <strong>✅</strong>

          <span>{message}</span>

          <button className='ghost' onClick={() => setMessage('')}>
            Fechar
          </button>
        </div>
      )}

      {error && (
        <div className='investment-alert investment-alert-error'>
          <strong>⚠️</strong>

          <span>{error}</span>

          <button className='ghost' onClick={() => setError('')}>
            Fechar
          </button>
        </div>
      )}

      {/* =====================================================
          VISÃO GERAL
      ====================================================== */}

      <div className='investment-kpis'>
        <div className='investment-kpi'>
          <small>Entradas</small>

          <strong className='profit-positive'>
            {formatMoney(stats.income)}
          </strong>

          <span>renda no mês</span>
        </div>

        <div className='investment-kpi'>
          <small>Gastos</small>

          <strong className='profit-negative'>
            {formatMoney(stats.expenses)}
          </strong>

          <span>despesas no mês</span>
        </div>

        <div
          className={`investment-kpi ${
            stats.balance >= 0 ? 'investment-positive' : 'investment-negative'
          }`}
        >
          <small>Saldo</small>

          <strong>{formatMoney(stats.balance)}</strong>

          <span>{formatPercent(stats.savingsRate)} da renda</span>
        </div>

        <div className='investment-kpi'>
          <small>Transações</small>

          <strong>{monthTransactions.length}</strong>

          <span>neste mês</span>
        </div>
      </div>

      {/* =====================================================
          FLUXO FINANCEIRO
      ====================================================== */}

      <div className='investment-mini-stats'>
        <div>
          <span>🏠 Gastos fixos</span>

          <strong>{formatMoney(stats.fixedExpenses)}</strong>
        </div>

        <div>
          <span>🛒 Gastos variáveis</span>

          <strong>{formatMoney(stats.variableExpenses)}</strong>
        </div>

        <div>
          <span>✅ Já pago</span>

          <strong>{formatMoney(stats.paidExpenses)}</strong>
        </div>

        <div>
          <span>⏳ Pendente</span>

          <strong>{formatMoney(stats.pendingExpenses)}</strong>
        </div>
      </div>

      {/* =====================================================
          ORÇAMENTO
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🎯 Orçamento mensal</strong>

            <small>Controle quanto você pretende gastar.</small>
          </div>

          <strong>
            {formatMoney(stats.expenses)} / {formatMoney(finance.monthlyBudget)}
          </strong>
        </div>

        <div className='progress' style={{ height: 12 }}>
          <span
            style={{
              width: `${Math.min(100, budgetUsed)}%`,
            }}
          />
        </div>

        <small className='subtitle'>
          {finance.monthlyBudget > 0
            ? `${budgetUsed.toFixed(1)}% do orçamento utilizado.`
            : 'Defina um orçamento mensal abaixo.'}
        </small>
      </div>

      {/* =====================================================
          CONFIGURAÇÕES FINANCEIRAS
      ====================================================== */}

      <div className='focus investment-form'>
        <div className='investment-section-title'>
          <div>
            <strong>⚙️ Planejamento financeiro</strong>

            <small>Defina sua renda e limite de gastos.</small>
          </div>
        </div>

        <div className='investment-form-grid'>
          <label>
            <span>Salário / renda mensal</span>

            <input
              type='number'
              min='0'
              step='0.01'
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder='R$ 0,00'
            />
          </label>

          <label>
            <span>Orçamento mensal</span>

            <input
              type='number'
              min='0'
              step='0.01'
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
              placeholder='R$ 0,00'
            />
          </label>
        </div>

        <button
          className='primary investment-submit'
          onClick={saveFinancialSettings}
        >
          💾 Salvar planejamento
        </button>
      </div>

      {/* =====================================================
          GASTOS POR CATEGORIA
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>📊 Gastos por categoria</strong>

            <small>Veja para onde seu dinheiro está indo.</small>
          </div>
        </div>

        {categoryStats.length ? (
          <div className='allocation-list'>
            {categoryStats.map((item) => (
              <div className='allocation-row' key={item.category}>
                <strong>{item.category}</strong>

                <div className='allocation-track'>
                  <span
                    style={{
                      width: `${Math.min(100, item.percentage)}%`,
                    }}
                  />
                </div>

                <strong>{formatMoney(item.value)}</strong>

                <small>{item.percentage.toFixed(1)}%</small>
              </div>
            ))}
          </div>
        ) : (
          <p className='subtitle'>Nenhum gasto registrado neste mês.</p>
        )}
      </div>

      {/* =====================================================
          NOVA TRANSAÇÃO
      ====================================================== */}

      <div className='focus investment-form'>
        <div className='investment-section-title'>
          <div>
            <strong>
              {editingId ? '✏️ Editar transação' : '➕ Registrar transação'}
            </strong>

            <small>Registre entradas e saídas do seu dinheiro.</small>
          </div>

          {editingId && (
            <button className='ghost' onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>

        <div className='tabs'>
          <button
            className={transactionType === 'expense' ? 'active' : ''}
            onClick={() => {
              setTransactionType('expense');
              setCategory('Alimentação');
            }}
          >
            💸 Gasto
          </button>

          <button
            className={transactionType === 'income' ? 'active' : ''}
            onClick={() => {
              setTransactionType('income');
              setCategory('Salário');
            }}
          >
            💰 Entrada
          </button>
        </div>

        <div className='investment-form-grid'>
          <label>
            <span>Descrição</span>

            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                transactionType === 'expense' ? 'Ex.: Mercado' : 'Ex.: Salário'
              }
            />
          </label>

          <label>
            <span>Categoria</span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {(transactionType === 'expense'
                ? EXPENSE_CATEGORIES
                : INCOME_CATEGORIES
              ).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Valor</span>

            <input
              type='number'
              min='0'
              step='0.01'
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder='R$ 0,00'
            />
          </label>

          <label>
            <span>Data</span>

            <input
              type='date'
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label>
            <span>Forma de pagamento</span>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {PAYMENT_METHODS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {transactionType === 'expense' && (
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={fixed}
                onChange={(event) => setFixed(event.target.checked)}
              />

              <span>
                Despesa fixa
                <small>Ex.: aluguel, internet, academia</small>
              </span>
            </label>
          )}
        </div>

        <TagPicker data={data} save={save} value={transactionTags} onChange={setTransactionTags} compact />

        <button className='primary investment-submit' onClick={handleSubmit}>
          {editingId ? '💾 Salvar alteração' : '➕ Registrar transação'}
        </button>
      </div>

      {/* =====================================================
          LISTA
      ====================================================== */}

      <div className='focus investment-history-list'>
        <div className='investment-section-title'>
          <div>
            <strong>📋 Movimentações</strong>

            <small>Transações de {month}</small>
          </div>
        </div>

        {monthTransactions.length ? (
          <div className='portfolio-history-table'>
            {monthTransactions.map((transaction) => (
              <div className='history-row' key={transaction.id}>
                <span>
                  {transaction.type === 'income' ? '💰' : '💸'}{' '}
                  <strong>{transaction.description}</strong>
                  <small className='table-subtext'>
                    {transaction.category} · {transaction.paymentMethod}
                  </small>
                </span>

                <span>
                  {new Date(`${transaction.date}T12:00:00`).toLocaleDateString(
                    'pt-BR',
                  )}
                </span>

                <strong
                  className={
                    transaction.type === 'income'
                      ? 'profit-positive'
                      : 'profit-negative'
                  }
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatMoney(transaction.amount)}
                </strong>

                <span>
                  {transaction.type === 'expense' && (
                    <button
                      className='ghost'
                      onClick={() => togglePaid(transaction)}
                      title='Alterar status'
                    >
                      {transaction.paid ? '✅' : '⏳'}
                    </button>
                  )}

                  <button
                    className='ghost'
                    onClick={() => startEdit(transaction)}
                  >
                    ✏️
                  </button>

                  <button
                    className='ghost danger-button'
                    onClick={() => removeTransaction(transaction.id)}
                  >
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className='investment-empty'>
            <span>💰</span>

            <strong>Nenhuma movimentação</strong>

            <small>Registre sua primeira entrada ou saída.</small>
          </div>
        )}
      </div>

      {/* =====================================================
          RESUMO FINANCEIRO
      ====================================================== */}

      <div className='focus investment-focus'>
        <div className='investment-section-title'>
          <div>
            <strong>🧠 Diagnóstico financeiro</strong>

            <small>Uma visão rápida da sua situação no mês.</small>
          </div>
        </div>

        <div className='investment-mini-stats'>
          <div>
            <span>💰 Renda</span>

            <strong>{formatMoney(stats.income)}</strong>
          </div>

          <div>
            <span>💸 Gastos</span>

            <strong>{formatMoney(stats.expenses)}</strong>
          </div>

          <div>
            <span>📈 Taxa de poupança</span>

            <strong>{stats.savingsRate.toFixed(1)}%</strong>
          </div>

          <div>
            <span>🎯 Situação</span>

            <strong>
              {stats.balance > 0
                ? 'Positiva'
                : stats.balance < 0
                  ? 'Déficit'
                  : 'Neutra'}
            </strong>
          </div>
        </div>

        {stats.balance < 0 && (
          <div className='investment-alert investment-alert-error'>
            ⚠️ Seus gastos estão maiores que suas entradas neste mês.
          </div>
        )}

        {stats.balance > 0 && (
          <div className='investment-alert investment-alert-success'>
            ✅ Você terminou o mês com saldo positivo.
          </div>
        )}
      </div>

      {/* =====================================================
          AVISO
      ====================================================== */}

      <div className='focus' style={{ fontSize: 12 }}>
        ℹ️ Este módulo é destinado ao controle financeiro pessoal. O módulo{' '}
        <strong>Investimentos</strong> é responsável pela análise e
        acompanhamento da carteira de ativos.
      </div>
    </div>
  );
}
