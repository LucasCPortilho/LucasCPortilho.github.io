document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const transactionForm = document.getElementById('transactionForm');
  const descriptionInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const transactionList = document.getElementById('transactionList');
  const balanceDisplay = document.getElementById('balance');
  const incomeDisplay = document.getElementById('income');
  const expenseDisplay = document.getElementById('expense');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const setGoalBtn = document.getElementById('setGoalBtn');
  const monthlyGoalInput = document.getElementById('monthlyGoal');
  const exportCSVBtn = document.getElementById('exportCSV');

  // Categorias disponíveis
  const categories = [
    { id: 1, name: "Alimentação", icon: "fa-utensils" },
    { id: 2, name: "Transporte", icon: "fa-car" },
    { id: 3, name: "Moradia", icon: "fa-home" },
    { id: 4, name: "Lazer", icon: "fa-gamepad" },
    { id: 5, name: "Saúde", icon: "fa-heartbeat" },
    { id: 6, name: "Educação", icon: "fa-book" },
    { id: 7, name: "Salário", icon: "fa-money-bill-wave" },
    { id: 8, name: "Outros", icon: "fa-ellipsis-h" }
  ];

  // Dados
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let financialGoals = JSON.parse(localStorage.getItem('financialGoals')) || {
    monthlySavings: 0,
    currentSavings: 0
  };
  let currentFilter = 'all';

  // Inicializar
  updateUI();
  initDarkMode();

  // Event Listeners
  transactionForm.addEventListener('submit', addTransaction);
  darkModeToggle.addEventListener('click', toggleDarkMode);
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => filterTransactions(btn.dataset.filter));
  });
  setGoalBtn.addEventListener('click', setMonthlyGoal);
  exportCSVBtn.addEventListener('click', exportToCSV);

  // Adicionar transação
  function addTransaction(e) {
    e.preventDefault();
    
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = document.querySelector('input[name="type"]:checked').value;
    const categoryId = parseInt(document.getElementById('category').value);
    const category = categories.find(c => c.id === categoryId) || categories[7]; // Default: "Outros"

    if (description && !isNaN(amount) && amount > 0) {
      const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        category,
        date: new Date().toISOString()
      };

      transactions.push(transaction);
      updateLocalStorage();
      updateUI();
      transactionForm.reset();
      descriptionInput.focus();
      
      // Atualizar metas se for uma receita
      if (type === 'income') {
        updateSavingsGoal(amount);
      }
    } else {
      alert('Por favor, preencha todos os campos corretamente!');
    }
  }

  // Atualizar UI
  function updateUI() {
    const filteredTransactions = filterTransactions(currentFilter, false);
    
    // Calcular totais
    const amounts = transactions.map(t => t.type === 'income' ? t.amount : -t.amount);
    const balance = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

    // Atualizar displays
    balanceDisplay.textContent = `R$ ${balance}`;
    incomeDisplay.textContent = `R$ ${income}`;
    expenseDisplay.textContent = `R$ ${expense}`;

    // Limpar lista
    transactionList.innerHTML = '';

    // Adicionar transações filtradas
    if (filteredTransactions.length === 0) {
      transactionList.innerHTML = '<li class="no-transactions">Nenhuma transação encontrada</li>';
    } else {
      filteredTransactions.forEach(transaction => {
        const li = document.createElement('li');
        
        li.innerHTML = `
          <div class="transaction-description">
            <i class="fas ${transaction.type === 'income' ? 'fa-arrow-down income-text' : 'fa-arrow-up expense-text'}"></i>
            <span>${transaction.description}</span>
            <span class="category-tag" style="background-color: ${getCategoryColor(transaction.category.id)}">
              <i class="fas ${transaction.category.icon}"></i> ${transaction.category.name}
            </span>
          </div>
          <span class="transaction-amount ${transaction.type === 'income' ? 'income-text' : 'expense-text'}">
            ${transaction.type === 'income' ? '+' : '-'} R$ ${transaction.amount.toFixed(2)}
          </span>
          <button class="delete-btn" onclick="removeTransaction(${transaction.id})" aria-label="Remover transação">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;
        
        transactionList.appendChild(li);
      });
    }

    updateChart();
  }

  // Filtrar transações
  function filterTransactions(filter, updateActive = true) {
    currentFilter = filter;
    
    if (updateActive) {
      filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
    }
    
    if (filter === 'all') return [...transactions];
    return transactions.filter(t => t.type === filter);
  }

  // Remover transação (função global para o onclick)
  window.removeTransaction = function(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      transactions = transactions.filter(t => t.id !== id);
      updateLocalStorage();
      updateUI();
    }
  };

  // Atualizar localStorage
  function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // Dark Mode
  function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  // Metas Financeiras
  function updateSavingsGoal(amount) {
    financialGoals.currentSavings += amount;
    localStorage.setItem('financialGoals', JSON.stringify(financialGoals));
    updateGoalsUI();
  }

  function setMonthlyGoal() {
    const goalAmount = parseFloat(monthlyGoalInput.value);
    if (!isNaN(goalAmount) {
      financialGoals.monthlySavings = goalAmount;
      financialGoals.currentSavings = 0;
      localStorage.setItem('financialGoals', JSON.stringify(financialGoals));
      updateGoalsUI();
      alert(`Meta mensal de R$ ${goalAmount.toFixed(2)} definida!`);
    }
  }

  function updateGoalsUI() {
    const progressBar = document.getElementById('savingsProgress');
    const savingsText = document.getElementById('savingsText');
    
    if (financialGoals.monthlySavings > 0) {
      const percentage = Math.min((financialGoals.currentSavings / financialGoals.monthlySavings) * 100, 100);
      progressBar.innerHTML = `<div style="width: ${percentage}%"></div>`;
      savingsText.textContent = `R$ ${financialGoals.currentSavings.toFixed(2)}/R$ ${financialGoals.monthlySavings.toFixed(2)}`;
    } else {
      progressBar.innerHTML = '<div style="width: 0%"></div>';
      savingsText.textContent = 'Nenhuma meta definida';
    }
  }

  // Exportar para CSV
  function exportToCSV() {
    if (transactions.length === 0) {
      alert('Nenhuma transação para exportar!');
      return;
    }

    let csv = 'Data,Descrição,Categoria,Valor,Tipo\n';
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString();
      csv += `"${date}","${transaction.description}","${transaction.category.name}",${transaction.amount},"${transaction.type === 'income' ? 'Receita' : 'Despesa'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Gráfico
  let myChart;

  function updateChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    
    // Agrupar por dia (últimos 7 dias)
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }));
    }
    
    const incomeData = dates.map(date => {
      return transactions.filter(t => {
        const transDate = new Date(t.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        return transDate === date && t.type === 'income';
      }).reduce((acc, t) => acc + t.amount, 0);
    });
    
    const expenseData = dates.map(date => {
      return transactions.filter(t => {
        const transDate = new Date(t.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        return transDate === date && t.type === 'expense';
      }).reduce((acc, t) => acc + t.amount, 0);
    });

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            backgroundColor: '#2e7d32',
            borderRadius: 6,
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: '#c62828',
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value;
              }
            }
          }
        }
      }
    });
  }

  // Função auxiliar para cores das categorias
  function getCategoryColor(categoryId) {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
      '#536DFE', '#448AFF', '#40C4FF', '#64FFDA',
      '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00'
    ];
    return colors[categoryId % colors.length];
  }
});
