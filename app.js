// app.js
let transactions = []
let budgets = {
    "Food": 350, "Transport": 150, "Shopping": 200,
    "Bills": 400, "Entertainment": 120, "Health": 80
}

const categories = [
    {name: "Food", emoji: "🍔", color: "#14b8a6"},
    {name: "Transport", emoji: "🚕", color: "#22d3ee"},
    {name: "Shopping", emoji: "🛍️", color: "#f43f5e"},
    {name: "Bills", emoji: "📄", color: "#a78bfa"},
    {name: "Entertainment", emoji: "🎥", color: "#eab308"},
    {name: "Health", emoji: "🩹", color: "#ec4899"},
    {name: "Income", emoji: "💰", color: "#10b981"}
]

let currentType = 1 // 0 = income, 1 = expense
let selectedCategory = categories[0]

// Load from localStorage
function loadData() {
    const saved = localStorage.getItem('pulse_transactions')
    if (saved) transactions = JSON.parse(saved)
    
    const savedBudgets = localStorage.getItem('pulse_budgets')
    if (savedBudgets) budgets = JSON.parse(savedBudgets)
}

// Save
function saveData() {
    localStorage.setItem('pulse_transactions', JSON.stringify(transactions))
    localStorage.setItem('pulse_budgets', JSON.stringify(budgets))
}

function formatMoney(amount) {
    return '$' + Math.abs(amount).toLocaleString('en-US')
}

// Render quick categories
function renderQuickCategories() {
    const container = document.getElementById('quick-categories')
    container.innerHTML = ''
    categories.slice(0, 6).forEach(cat => {
        const div = document.createElement('div')
        div.className = `flex flex-col items-center cursor-pointer active:scale-95 transition-all`
        div.innerHTML = `
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-4xl bg-neutral-900 mb-2 shadow-inner">${cat.emoji}</div>
            <span class="text-xs text-neutral-400">${cat.name}</span>
        `
        div.onclick = () => {
            selectedCategory = cat
            showAddModal()
        }
        container.appendChild(div)
    })
}

// Render recent (with empty state)
function renderRecent() {
    const container = document.getElementById('recent-list')
    container.innerHTML = ''
    
    const recent = [...transactions].reverse().slice(0, 5)
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div onclick="showAddModal()" class="empty-state rounded-3xl p-8 text-center cursor-pointer hover:border-teal-500/50 transition-colors">
                <div class="text-5xl mb-3">🌊</div>
                <p class="font-medium text-neutral-300">Your flow starts here</p>
                <p class="text-xs text-neutral-500 mt-1">Tap to add your first transaction</p>
            </div>
        `
        return
    }
    
    recent.forEach(t => {
        const div = document.createElement('div')
        div.className = `transaction flex justify-between items-center bg-neutral-900 rounded-3xl px-5 py-4`
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center text-3xl">${t.emoji}</div>
                <div>
                    <p class="font-medium">${t.note || t.category}</p>
                    <p class="text-xs text-neutral-500">${t.date}</p>
                </div>
            </div>
            <div class="${t.type === 0 ? 'text-emerald-400' : 'text-rose-400'} font-semibold text-lg">
                ${t.type === 0 ? '+' : '-'}${formatMoney(t.amount)}
            </div>
        `
        container.appendChild(div)
    })
}

// Render full list
function renderFullList(filtered = null) {
    const container = document.getElementById('full-transaction-list')
    container.innerHTML = ''
    
    const list = filtered || [...transactions].reverse()
    
    if (list.length === 0) {
        container.innerHTML = `<p class="text-center text-neutral-500 py-12">No transactions yet</p>`
        return
    }
    
    list.forEach((t, index) => {
        const div = document.createElement('div')
        div.className = `flex justify-between items-center bg-neutral-900 rounded-3xl px-5 py-5 group`
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="text-4xl">${t.emoji}</div>
                <div>
                    <p class="font-medium">${t.note || t.category}</p>
                    <p class="text-xs text-neutral-500">${t.date} • ${t.category}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="${t.type === 0 ? 'text-emerald-400' : 'text-rose-400'} text-xl font-semibold">
                    ${t.type === 0 ? '+' : '-'}${formatMoney(t.amount)}
                </p>
                <button onclick="deleteTransaction(${transactions.length - 1 - index}); event.stopImmediatePropagation()" 
                        class="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 mt-1">delete</button>
            </div>
        `
        container.appendChild(div)
    })
}

// Calculate totals
function calculateTotals() {
    let income = 0, expense = 0
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    
    transactions.forEach(t => {
        if (t.date.startsWith(thisMonth)) {
            if (t.type === 0) income += t.amount
            else expense += t.amount
        }
    })
    
    const balance = income - expense
    document.getElementById('balance').textContent = formatMoney(balance)
    document.getElementById('income-total').textContent = formatMoney(income)
    document.getElementById('expense-total').textContent = formatMoney(expense)
    
    return {income, expense}
}

// Render breakdown
function renderBreakdown() {
    const container = document.getElementById('category-breakdown')
    container.innerHTML = ''
    
    const spentByCat = {}
    transactions.forEach(t => {
        if (t.type === 1) spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount
    })
    
    if (Object.keys(spentByCat).length === 0) {
        container.innerHTML = `<p class="text-neutral-500 text-center py-6">No expenses yet</p>`
        return
    }
    
    Object.keys(spentByCat).slice(0, 5).forEach(cat => {
        const amount = spentByCat[cat]
        const catInfo = categories.find(c => c.name === cat) || {emoji: '📦', color: '#64748b'}
        const percent = Math.min(Math.floor((amount / 800) * 100), 100)
        
        const div = document.createElement('div')
        div.innerHTML = `
            <div class="flex justify-between text-sm mb-2">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${catInfo.emoji}</span>
                    <span>${cat}</span>
                </div>
                <span class="font-medium">${formatMoney(amount)}</span>
            </div>
            <div class="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
        `
        container.appendChild(div)
    })
}

// Render budgets
function renderBudgets() {
    const container = document.getElementById('budget-list')
    container.innerHTML = ''
    
    Object.keys(budgets).forEach(cat => {
        const spent = transactions
            .filter(t => t.type === 1 && t.category === cat)
            .reduce((a, t) => a + t.amount, 0)
        
        const budget = budgets[cat]
        const percent = Math.min(Math.floor((spent / budget) * 100), 100)
        
        const div = document.createElement('div')
        div.className = 'bg-neutral-900 rounded-3xl p-6'
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="text-4xl">${categories.find(c => c.name === cat).emoji}</div>
                    <div>
                        <p class="font-medium">${cat}</p>
                        <p class="text-xs text-neutral-400">${formatMoney(spent)} of ${formatMoney(budget)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-mono">${percent}%</span>
                </div>
            </div>
            <div class="h-2 bg-neutral-800 rounded-full mt-5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full" 
                     style="width: ${percent}%"></div>
            </div>
        `
        container.appendChild(div)
    })
}

// Update pie
function updatePieChart() {
    const pie = document.getElementById('pie-chart')
    const colors = ['#14b8a6', '#22d3ee', '#f43f5e', '#a78bfa', '#eab308']
    let stops = ''
    let angle = 0
    
    const catList = Object.keys(budgets)
    catList.forEach((cat, i) => {
        const spent = transactions.filter(t => t.type === 1 && t.category === cat).reduce((a, t) => a + t.amount, 0)
        if (spent === 0) return
        const slice = Math.max(15, Math.floor((spent / 1200) * 360))
        stops += `${colors[i % colors.length]} ${angle}deg ${angle + slice}deg, `
        angle += slice
    })
    
    pie.style.background = stops ? `conic-gradient(${stops.slice(0,-2)})` : 'conic-gradient(#27272a 0deg 360deg)'
}

// Render insights
function renderInsights() {
    const {expense} = calculateTotals()
    document.getElementById('spent-this-month').textContent = formatMoney(expense)
    
    const spentByCat = {}
    transactions.filter(t => t.type === 1).forEach(t => {
        spentByCat[t.category] = (spentByCat[t.category] || 0) + t.amount
    })
    
    const biggest = Object.entries(spentByCat).sort((a,b) => b[1]-a[1])[0]
    if (biggest) {
        document.getElementById('biggest-spend').textContent = biggest[0]
        document.getElementById('biggest-amount').textContent = formatMoney(biggest[1])
    } else {
        document.getElementById('biggest-spend').textContent = '—'
        document.getElementById('biggest-amount').textContent = '$0'
    }
    
    const avg = expense / 30 || 0
    document.getElementById('avg-daily').textContent = formatMoney(Math.floor(avg))
}

// Type selection (now FIXED - mutually exclusive)
function setType(type) {
    currentType = type
    
    const incBtn = document.getElementById('type-0')
    const expBtn = document.getElementById('type-1')
    
    if (type === 0) {
        incBtn.classList.add('bg-emerald-500', 'text-white')
        expBtn.classList.remove('bg-rose-500', 'text-white')
    } else {
        expBtn.classList.add('bg-rose-500', 'text-white')
        incBtn.classList.remove('bg-emerald-500', 'text-white')
    }
}

// Show modal (defaults to Expense)
function showAddModal() {
    document.getElementById('add-modal').classList.remove('hidden')
    document.getElementById('add-modal').classList.add('flex')
    
    // Reset to clean state
    document.getElementById('amount-input').value = ''
    document.getElementById('note-input').value = ''
    
    // Set default to Expense
    setType(1)
    
    // Render categories
    const picker = document.getElementById('category-picker')
    picker.innerHTML = ''
    categories.forEach(cat => {
        const div = document.createElement('div')
        div.className = `flex flex-col items-center cursor-pointer ${cat.name === selectedCategory.name ? 'scale-110' : ''}`
        div.innerHTML = `<div class="text-5xl mb-1">${cat.emoji}</div><span class="text-xs">${cat.name}</span>`
        div.onclick = () => {
            selectedCategory = cat
            showAddModal()
        }
        picker.appendChild(div)
    })
    
    document.getElementById('amount-input').focus()
}

function hideAddModal() {
    const modal = document.getElementById('add-modal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
}

function addTransaction() {
    const amountStr = document.getElementById('amount-input').value.trim()
    const note = document.getElementById('note-input').value.trim()
    
    if (!amountStr || parseFloat(amountStr) <= 0) {
        alert("Please enter a valid amount greater than 0")
        return
    }
    
    const amount = parseFloat(amountStr)
    
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    
    transactions.push({
        id: Date.now(),
        type: currentType,
        amount: amount,
        category: selectedCategory.name,
        emoji: selectedCategory.emoji,
        note: note || selectedCategory.name,
        date: date
    })
    
    saveData()
    hideAddModal()
    refreshAll()
    
    if (currentType === 0) triggerConfetti()
}

// Delete
function deleteTransaction(index) {
    if (confirm('Delete this entry?')) {
        transactions.splice(index, 1)
        saveData()
        refreshAll()
    }
}

// Filter
function filterTransactions() {
    const term = document.getElementById('search-input').value.toLowerCase().trim()
    if (!term) {
        renderFullList()
        return
    }
    const filtered = transactions.filter(t => 
        (t.note && t.note.toLowerCase().includes(term)) || 
        t.category.toLowerCase().includes(term)
    )
    renderFullList(filtered)
}

// Refresh everything
function refreshAll() {
    calculateTotals()
    renderRecent()
    renderFullList()
    renderBreakdown()
    renderBudgets()
    updatePieChart()
    renderInsights()
}

function resetBudgets() {
    if (confirm('Reset all budgets?')) {
        budgets = {"Food":350,"Transport":150,"Shopping":200,"Bills":400,"Entertainment":120,"Health":80}
        saveData()
        renderBudgets()
    }
}

// Confetti
function triggerConfetti() {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    let particles = []
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.4,
            size: Math.random() * 8 + 5,
            speedY: Math.random() * 4 + 3,
            color: ['#14b8a6','#67e8f9','#a5f3fc'][Math.floor(Math.random()*3)]
        })
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach((p, i) => {
            p.y += p.speedY
            ctx.fillStyle = p.color
            ctx.fillRect(p.x, p.y, p.size, p.size*0.6)
            if (p.y > canvas.height) particles.splice(i,1)
        })
        if (particles.length > 0) requestAnimationFrame(animate)
        else canvas.remove()
    }
    animate()
}

// Tab switch
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'))
    document.getElementById(['tab-overview','tab-transactions','tab-budget','tab-insights'][tab]).classList.remove('hidden')
    
    document.querySelectorAll('.nav-item').forEach((el,i) => el.classList.toggle('text-teal-400', i===tab))
    
    if (tab === 1) renderFullList()
    if (tab === 3) renderInsights()
}

// Init
function initializePulse() {
    loadData()
    renderQuickCategories()
    refreshAll()
    switchTab(0)
    
    console.log('%c✨ Pulse v2 ready — clean & fixed', 'color:#14b8a6; font-family:monospace')
}

window.onload = initializePulse
