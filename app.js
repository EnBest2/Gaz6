document.addEventListener('DOMContentLoaded', () => {
    // Tranzakciós elemek
    const form = document.getElementById('form');
    const typeElem = document.getElementById('type');
    const amountElem = document.getElementById('amount');
    const categoryElem = document.getElementById('category');
    const dateElem = document.getElementById('date');
    const descriptionElem = document.getElementById('description');
    const transactionsList = document.getElementById('transactions');
    const balanceElem = document.getElementById('balance');
    const totalIncomeElem = document.getElementById('total-income');
    const totalExpenseElem = document.getElementById('total-expense');
    
    // Megtakarítás elemek
    const savingsForm = document.getElementById('savings-form');
    const savingsAmountElem = document.getElementById('savings-amount');
    const savingsList = document.getElementById('savings-list');
    const totalSavingsElem = document.getElementById('total-savings');
    
    // Egyéb gombok és értesítési elem
    const themeToggleBtn = document.getElementById('theme-toggle');
    const syncBtn = document.getElementById('sync-btn');
    const exportBtn = document.getElementById('export-btn');
    const reminderBtn = document.getElementById('reminder-btn');
    const notificationDiv = document.getElementById('notification');
    const chartCanvas = document.getElementById('financialChart');
    
    let transactions = [];
    let savings = [];
    let dragSrcIndex = null;
    let financialChart = null;
    
    // Értesítések megjelenítése
    function showNotification(message, duration = 3000) {
        notificationDiv.textContent = message;
        notificationDiv.style.display = 'block';
        setTimeout(() => {
            notificationDiv.style.display = 'none';
        }, duration);
    }
    
    // ––––– Tranzakciók kezelése –––––
    
    function loadTransactions() {
       const savedTransactions = localStorage.getItem('transactions');
       if (savedTransactions) {
         transactions = JSON.parse(savedTransactions);
       }
    }
    
    function saveTransactions() {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function updateDashboard() {
      let income = 0, expense = 0;
      transactions.forEach(t => {
         if (t.type === 'income') { income += t.amount; }
         if (t.type === 'expense') { expense += t.amount; }
      });
      const balance = income - expense;
      balanceElem.textContent = balance;
      totalIncomeElem.textContent = income;
      totalExpenseElem.textContent = expense;
      updateChart(income, expense);
    }
    
    // Diagram inicializálása / frissítése Chart.js segítségével
    function initChart(income, expense) {
      const data = {
        labels: ['Bevétel', 'Kiadás'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#28a745', '#dc3545']
        }]
      };
      financialChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
    
    function updateChart(income, expense) {
      if (financialChart) {
          financialChart.data.datasets[0].data = [income, expense];
          financialChart.update();
      } else {
          initChart(income, expense);
      }
    }
    
    // Drag and drop események a tranzakciók listájához
    function handleDragStart(e) {
       dragSrcIndex = parseInt(e.currentTarget.getAttribute('data-index'));
       e.dataTransfer.effectAllowed = 'move';
    }
    function handleDragOver(e) {
       e.preventDefault();
       e.dataTransfer.dropEffect = 'move';
    }
    function handleDrop(e) {
       e.preventDefault();
       const targetLI = e.currentTarget;
       const targetIndex = parseInt(targetLI.getAttribute('data-index'));
       if (dragSrcIndex === null || isNaN(targetIndex)) {
          dragSrcIndex = null;
          return;
       }
       const draggedItem = transactions[dragSrcIndex];
       transactions.splice(dragSrcIndex, 1);
       transactions.splice(targetIndex, 0, draggedItem);
       saveTransactions();
       updateDashboard();
       renderTransactions();
       showNotification('Tranzakció sorrend módosítva!');
       dragSrcIndex = null;
    }
    
    function createTransactionElement(transaction, index) {
      const li = document.createElement('li');
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-index', index);
      li.innerHTML = `
         <strong>${transaction.type === 'income' ? 'Bevétel' : 'Kiadás'}</strong> – 
         ${transaction.amount} Ft – ${transaction.category} – ${transaction.date}
         <br>
         ${transaction.description ? transaction.description : ''}
         <br>
         <button data-index="${index}" class="edit">Szerkesztés</button>
         <button data-index="${index}" class="delete">Törlés</button>
      `;
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      return li;
    }
    
    function renderTransactions() {
       transactionsList.innerHTML = '';
       transactions.forEach((transaction, index) => {
         const li = createTransactionElement(transaction, index);
         transactionsList.appendChild(li);
       });
    }
    
    form.addEventListener('submit', function(e) {
       e.preventDefault();
       const transaction = {
         type: typeElem.value,
         amount: Number(amountElem.value),
         category: categoryElem.value,
         date: dateElem.value,
         description: descriptionElem.value
       };
       transactions.push(transaction);
       saveTransactions();
       updateDashboard();
       renderTransactions();
       form.reset();
       showNotification('Tranzakció mentve!');
    });
    
    transactionsList.addEventListener('click', function(e) {
       if (e.target.classList.contains('delete')) {
         const index = e.target.getAttribute('data-index');
         transactions.splice(index, 1);
         saveTransactions();
         updateDashboard();
         renderTransactions();
         showNotification('Tranzakció törölve!');
       } else if (e.target.classList.contains('edit')) {
         const index = e.target.getAttribute('data-index');
         const transaction = transactions[index];
         typeElem.value = transaction.type;
         amountElem.value = transaction.amount;
         categoryElem.value = transaction.category;
         dateElem.value = transaction.date;
         descriptionElem.value = transaction.description;
         transactions.splice(index, 1);
         saveTransactions();
         updateDashboard();
         renderTransactions();
         showNotification('Tranzakció szerkesztésre került, módosítsd, majd mentsd el újra!');
       }
    });
    
    // ––––– Megtakarítások kezelése –––––
    function loadSavings() {
      const savedSavings = localStorage.getItem('savings');
      if (savedSavings) {
         savings = JSON.parse(savedSavings);
      }
    }
    
    function saveSavings() {
      localStorage.setItem('savings', JSON.stringify(savings));
    }
    
    function updateSavingsSummary() {
      const total = savings.reduce((acc, item) => acc + item.amount, 0);
      totalSavingsElem.textContent = total;
    }
    
    function renderSavings() {
      savingsList.innerHTML = '';
      savings.forEach((item, index) => {
         const li = document.createElement('li');
         li.innerHTML = `
            Megtakarítás: ${item.amount} Ft – ${item.date}
            <button data-index="${index}" class="savings-delete">Törlés</button>
         `;
         // Egyszerű törlési esemény
         li.querySelector('.savings-delete').addEventListener('click', () => {
            savings.splice(index, 1);
            saveSavings();
            updateSavingsSummary();
            renderSavings();
            showNotification('Megtakarítás törölve!');
         });
         savingsList.appendChild(li);
      });
    }
    
    savingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const amount = Number(savingsAmountElem.value);
      if (amount > 0) {
         const item = {
            amount: amount,
            date: new Date().toLocaleDateString()
         };
         savings.push(item);
         saveSavings();
         updateSavingsSummary();
         renderSavings();
         savingsForm.reset();
         showNotification('Megtakarítás hozzáadva!');
      } else {
         showNotification('Adja meg a megtakarítás összegét!');
      }
    });
    
    // ––––– Egyéb funkciók –––––
    themeToggleBtn.addEventListener('click', function() {
       document.body.classList.toggle('dark');
       showNotification('Téma váltva!');
    });
    
    syncBtn.addEventListener('click', function() {
       if (navigator.onLine) {
         showNotification('Adatok szinkronizálva!');
       } else {
         showNotification('Nincs internetkapcsolat!');
       }
    });
    
    exportBtn.addEventListener('click', function() {
       let csvContent = "data:text/csv;charset=utf-8,";
       csvContent += "Típus,Összeg,Kategória,Dátum,Leírás\n";
       transactions.forEach(t => {
         csvContent += `${t.type === 'income' ? 'Bevétel' : 'Kiadás'},${t.amount},${t.category},${t.date},${t.description}\n`;
       });
       const encodedUri = encodeURI(csvContent);
       const link = document.createElement("a");
       link.setAttribute("href", encodedUri);
       link.setAttribute("download", "transactions.csv");
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       showNotification('CSV exportálva!');
    });
    
    reminderBtn.addEventListener('click', function() {
       if ("Notification" in window) {
          if (Notification.permission === "granted") {
             new Notification("Emlékeztető", {
               body: "Ne felejtsd el átnézni a pénzügyi adataidat és megtakarításaidat!",
             });
             showNotification("Emlékeztető értesítés elküldve!");
          } else if (Notification.permission !== "denied") {
             Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                   new Notification("Emlékeztető", {
                     body: "Ne felejtsd el átnézni a pénzügyi adataidat és megtakarításaidat!",
                   });
                   showNotification("Emlékeztető értesítés engedélyezve és elküldve!");
                } else {
                   showNotification("Értesítések blokkolva!");
                }
             });
          } else {
             showNotification("Értesítések blokkolva!");
          }
       } else {
          alert("A böngésződ nem támogatja az értesítéseket.");
       }
    });
    
    // Service Worker regisztráció
    if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('service-worker.js')
          .then(function(registration) {
             console.log('Service Worker regisztrálva:', registration);
          })
          .catch(function(error) {
             console.error('Service Worker hiba:', error);
          });
    }
    
    // Inicializálás
    loadTransactions();
    updateDashboard();
    renderTransactions();
    loadSavings();
    updateSavingsSummary();
    renderSavings();
});
