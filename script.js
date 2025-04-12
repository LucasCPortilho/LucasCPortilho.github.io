// Dados iniciais
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Elementos do DOM
const transactionForm = document.querySelector('.add-transaction');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const transactionList = document.getElementById('transactionList');
const balanceDisplay = document.getElementById('balance');
const incomeDisplay = document.getElementById('income');
const expenseDisplay = document.getElementById('expense');
const darkModeToggle = document.getElementById('darkModeToggle');

// Adicionar transação
transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const description = descriptionInput.value;
  const amount = parseFloat(amountInput.value);
  const type = typeSelect.value;

  if (description && amount) {
    const transaction = {
      id: Date.now(),
      description,
      amount,
      type
    };

    transactions.push(transaction);
    updateLocalStorage();
    updateUI();
    descriptionInput.value = '';
    amountInput.value = '';
  }
});

// Atualizar localStorage
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Atualizar a UI
function updateUI() {
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

  // Adicionar transações
  transactions.forEach(transaction => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${transaction.description}</span>
      <span class="${transaction.type}">${transaction.type === 'income' ? '+' : '-'} R$ ${Math.abs(transaction.amount).toFixed(2)}</span>
      <button onclick="removeTransaction(${transaction.id})">X</button>
    `;
    transactionList.appendChild(li);
  });

  updateChart();
}

// Remover transação
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  updateUI();
}

// Modo escuro
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Gráfico
let myChart;

function updateChart() {
  const ctx = document.getElementById('myChart').getContext('2d');
  
  // Agrupar por dia (simplificado)
  const dates = [...new Set(transactions.map(t => new Date(t.id).toLocaleDateString()))];
  const incomeData = dates.map(date => {
    return transactions.filter(t => 
      new Date(t.id).toLocaleDateString() === date && t.type === 'income'
    ).reduce((acc, t) => acc + t.amount, 0);
  });
  const expenseData = dates.map(date => {
    return transactions.filter(t => 
      new Date(t.id).toLocaleDateString() === date && t.type === 'expense'
    ).reduce((acc, t) => acc + t.amount, 0);
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
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: '#c62828',
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Inicializar
updateUI();