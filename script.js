// Dados iniciais
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

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

function addTransaction(e) {
  e.preventDefault();
  
  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = document.querySelector('input[name="type"]:checked').value;
  const categoryId = parseInt(document.getElementById('category').value);

  if (description && !isNaN(amount) && amount > 0) {
    const category = categories.find(c => c.id === categoryId);
    
    const transaction = {
      id: Date.now(),
      description,
      amount,
      type,
      category: category || categories[categories.length - 1], // Default: "Outros"
      date: new Date().toISOString()
    };

    transactions.push(transaction);
    updateLocalStorage();
    updateUI();
    transactionForm.reset();
    descriptionInput.focus();
    
    // Atualizar metas se for uma economia
    if (type === 'income') {
      updateSavingsGoal(amount);
    }
  } else {
    alert('Por favor, preencha todos os campos corretamente!');
  }
}

// Atualizar metas de economia
function updateSavingsGoal(amount) {
  financialGoals.currentSavings += amount;
  localStorage.setItem('financialGoals', JSON.stringify(financialGoals));
  updateGoalsUI();
}

// Atualizar UI das metas
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

// Inicializar categorias no formulário
function initCategorySelect() {
  const categorySelect = document.createElement('select');
  categorySelect.id = 'category';
  categorySelect.className = 'category-select';
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  const form = document.getElementById('transactionForm');
  const typeInputs = document.querySelector('.radio-group');
  form.insertBefore(categorySelect, typeInputs);
}

// Metas
let financialGoals = JSON.parse(localStorage.getItem('financialGoals')) || {
  monthlySavings: 0,
  currentSavings: 0
};

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


document.addEventListener('DOMContentLoaded', () => {
  // ... (código existente)
  
  // Novos inicializadores
  initCategorySelect();
  updateGoalsUI();
  
  // Configurar meta mensal
  document.getElementById('setGoalBtn').addEventListener('click', () => {
    const goalAmount = parseFloat(document.getElementById('monthlyGoal').value);
    if (!isNaN(goalAmount) {
      financialGoals.monthlySavings = goalAmount;
      financialGoals.currentSavings = 0;
      localStorage.setItem('financialGoals', JSON.stringify(financialGoals));
      updateGoalsUI();
      alert(`Meta mensal de R$ ${goalAmount.toFixed(2)} definida!`);
    }
  });
  
  // Exportar CSV
  document.getElementById('exportCSV').addEventListener('click', exportToCSV);
});

// Dentro da criação de cada transação (li)
li.innerHTML = `
  <div class="transaction-description">
    <i class="fas ${transaction.type === 'income' ? 'fa-arrow-down income-text' : 'fa-arrow-up expense-text'}"></i>
    <span>${transaction.description}</span>
    <span class="category-tag" style="background-color: ${getCategoryColor(transaction.category.id)}">
      <i class="fas ${transaction.category.icon}"></i> ${transaction.category.name}
    </span>
  </div>
  <!-- ... resto do código ... -->
`;

// Adicione esta função auxiliar
function getCategoryColor(categoryId) {
  const colors = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
    '#536DFE', '#448AFF', '#40C4FF', '#64FFDA',
    '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00'
  ];
  return colors[categoryId % colors.length];
}
