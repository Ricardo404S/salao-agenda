// ============================================================
// FIREBASE CONFIG — substitua com suas credenciais
// ============================================================
const FIREBASE_CONFIG = {
  // apiKey: "...",
  // authDomain: "...",
  // projectId: "...",
};

// ============================================================
// SIMULAÇÃO LOCAL (funciona sem Firebase para demonstração)
// ============================================================
let agendamentos = [
  { id: '1', nome: 'Maria Silva', telefone: '(11) 98765-4321', servico: 'Coloração', profissional: 'Ana', data: new Date().toISOString().split('T')[0], horario: '10:00', status: 'confirmado', obs: '' },
  { id: '2', nome: 'João Santos', telefone: '(11) 91234-5678', servico: 'Corte masculino', profissional: 'Carlos', data: new Date().toISOString().split('T')[0], horario: '14:00', status: 'pendente', obs: '' },
  { id: '3', nome: 'Ana Oliveira', telefone: '(11) 97654-3210', servico: 'Manicure', profissional: 'Beatriz', data: '2026-05-28', horario: '09:00', status: 'pendente', obs: 'Alergia a acetona' },
  { id: '4', nome: 'Lucas Pereira', telefone: '(11) 95432-1098', servico: 'Corte feminino', profissional: 'Ana', data: '2026-05-29', horario: '11:00', status: 'cancelado', obs: '' },
];

let filtroAtual = 'todos';
let idParaCancelar = null;

function gerarId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function iniciais(nome) {
  return nome.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
}

function formatarData(str) {
  const [a,m,d] = str.split('-');
  return `${d}/${m}/${a}`;
}

function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  event.target.classList.add('active');
  if (v === 'admin') renderLista();
}

function setFiltro(f, btn) {
  filtroAtual = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLista();
}

function renderLista() {
  const lista = document.getElementById('lista');
  const busca = document.getElementById('search-input').value.toLowerCase();
  const hoje = new Date().toISOString().split('T')[0];

  let itens = agendamentos.filter(a => {
    if (filtroAtual !== 'todos' && a.status !== filtroAtual) return false;
    if (busca && !a.nome.toLowerCase().includes(busca) && !a.servico.toLowerCase().includes(busca)) return false;
    return true;
  });

  itens.sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario));

  document.getElementById('stat-total').textContent = agendamentos.length;
  document.getElementById('stat-pend').textContent = agendamentos.filter(a=>a.status==='pendente').length;
  document.getElementById('stat-conf').textContent = agendamentos.filter(a=>a.status==='confirmado').length;
  document.getElementById('stat-hoje').textContent = agendamentos.filter(a=>a.data===hoje).length;

  if (itens.length === 0) {
    lista.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <p>Nenhum agendamento encontrado</p>
    </div>`;
    return;
  }

  lista.innerHTML = itens.map(a => `
    <div class="agenda-item" id="item-${a.id}">
      <div class="item-left">
        <div class="avatar">${iniciais(a.nome)}</div>
        <div>
          <div class="item-name">${a.nome}</div>
          <div class="item-detail">${a.servico} · ${a.profissional} · ${a.telefone}</div>
          ${a.obs ? `<div class="item-detail" style="color:#B45309">Obs: ${a.obs}</div>` : ''}
        </div>
      </div>
      <div class="item-right">
        <div class="item-datetime">
          <div class="item-date">${formatarData(a.data)}</div>
          <div class="item-time">${a.horario}</div>
        </div>
        <span class="badge badge-${a.status}">${a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span>
        <div class="action-btns">
          ${a.status === 'pendente' ? `<button class="btn-sm btn-confirm" onclick="confirmar('${a.id}')">Confirmar</button>` : ''}
          ${a.status !== 'cancelado' ? `<button class="btn-sm btn-cancel" onclick="abrirModal('${a.id}')">Cancelar</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function confirmar(id) {
  const ag = agendamentos.find(a => a.id === id);
  if (ag) { ag.status = 'confirmado'; renderLista(); mostrarToast('Agendamento confirmado!'); }
  // Firebase: updateDoc(doc(db, 'agendamentos', id), { status: 'confirmado' })
}

function abrirModal(id) {
  idParaCancelar = id;
  document.getElementById('modal-overlay').classList.add('open');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  idParaCancelar = null;
}

function confirmarCancelamento() {
  const ag = agendamentos.find(a => a.id === idParaCancelar);
  if (ag) { ag.status = 'cancelado'; renderLista(); mostrarToast('Agendamento cancelado.'); }
  // Firebase: updateDoc(doc(db, 'agendamentos', id), { status: 'cancelado' })
  fecharModal();
}

function salvarAgendamento(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const novo = {
    id: gerarId(),
    nome: document.getElementById('ag-nome').value,
    telefone: document.getElementById('ag-tel').value,
    servico: document.getElementById('ag-servico').value,
    profissional: document.getElementById('ag-prof').value,
    data: document.getElementById('ag-data').value,
    horario: document.getElementById('ag-hora').value,
    obs: document.getElementById('ag-obs').value,
    status: 'pendente',
  };

  // Simula delay de rede
  setTimeout(() => {
    agendamentos.push(novo);
    e.target.reset();
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Confirmar agendamento';
    mostrarToast('Agendamento realizado com sucesso!');

    // Firebase: addDoc(collection(db, 'agendamentos'), { ...novo, criadoEm: serverTimestamp() })
  }, 800);
}

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// Define data mínima como hoje
document.getElementById('ag-data').min = new Date().toISOString().split('T')[0];
renderLista();
