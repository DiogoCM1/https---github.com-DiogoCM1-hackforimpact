// Conectar ao servidor Socket.IO
const socket = io();

// Elementos do DOM
const analysisForm = document.getElementById('analysisForm');
const startBtn = document.getElementById('startBtn');
const progressCard = document.getElementById('progressCard');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsCard = document.getElementById('resultsCard');

// Status de configuração
const jiraStatus = document.getElementById('jiraStatus');
const azureStatus = document.getElementById('azureStatus');
const aiStatus = document.getElementById('aiStatus');

// Testar configuração ao carregar
async function testConfiguration() {
    try {
        const response = await fetch('/api/config/test');
        const data = await response.json();

        // Atualizar status do Jira
        if (data.jira) {
            jiraStatus.textContent = '✓ Conectado';
            jiraStatus.classList.add('ok');
        } else {
            jiraStatus.textContent = '⚠ Não configurado';
            jiraStatus.classList.add('error');
        }

        // Atualizar status do Azure DevOps
        if (data.azure_devops) {
            azureStatus.textContent = '✓ Conectado';
            azureStatus.classList.add('ok');
        } else {
            azureStatus.textContent = '✗ Erro';
            azureStatus.classList.add('error');
        }

        // Atualizar status do AI Provider
        if (data.ai_provider) {
            aiStatus.textContent = `✓ ${data.ai_provider.toUpperCase()}`;
            aiStatus.classList.add('ok');
        } else {
            aiStatus.textContent = '✗ Não configurado';
            aiStatus.classList.add('error');
        }
    } catch (error) {
        console.error('Erro ao testar configuração:', error);
        jiraStatus.textContent = '✗ Erro';
        azureStatus.textContent = '✗ Erro';
        aiStatus.textContent = '✗ Erro';
    }
}

// Chamar teste ao carregar
testConfiguration();

// Socket.IO events
socket.on('connect', () => {
    console.log('Conectado ao servidor');
});

socket.on('disconnect', () => {
    console.log('Desconectado do servidor');
});

socket.on('progress', (data) => {
    console.log('Progresso:', data);
    updateProgress(data.progress, data.message);
});

socket.on('analysis_complete', (result) => {
    console.log('Análise completa:', result);
    displayResults(result);
});

socket.on('analysis_error', (data) => {
    console.error('Erro na análise:', data);
    showError(data.error);
    enableForm();
});

// Submit do formulário
analysisForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Obter dados do formulário
    const formData = {
        repository: document.getElementById('repository').value.trim(),
        pr_id: document.getElementById('pr_id').value.trim(),
        issue_key: document.getElementById('issue_key').value.trim() || null,
        generate_documentation: document.getElementById('generate_documentation').checked,
        generate_code_review: document.getElementById('generate_code_review').checked
    };

    // Validação
    if (!formData.repository) {
        alert('Repositório é obrigatório!');
        return;
    }
    if (!formData.pr_id) {
        alert('PR ID é obrigatório!');
        return;
    }

    // Desabilitar formulário
    disableForm();

    // Mostrar progresso
    progressCard.style.display = 'block';
    resultsCard.style.display = 'none';
    updateProgress(0, 'Iniciando análise...');

    // Enviar para servidor
    console.log('Enviando análise:', formData);
    socket.emit('start_analysis', formData);
});

// Atualizar barra de progresso
function updateProgress(progress, message) {
    if (progress >= 0) {
        progressFill.style.width = `${progress}%`;
        progressFill.textContent = `${progress}%`;
        progressText.textContent = message;
    } else {
        // Erro
        progressFill.style.background = 'var(--danger)';
        progressText.innerHTML = `<span style="color: var(--danger);">${message}</span>`;
    }
}

// Mostrar erro
function showError(errorMessage) {
    progressCard.innerHTML = `
        <h2>Erro na Análise</h2>
        <div class="error-message">
            ${errorMessage}
        </div>
    `;
}

// Desabilitar formulário durante análise
function disableForm() {
    startBtn.disabled = true;
    startBtn.textContent = '⏳ Analisando...';
    const inputs = analysisForm.querySelectorAll('input, textarea, button');
    inputs.forEach(input => input.disabled = true);
}

// Habilitar formulário após análise
function enableForm() {
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Iniciar Análise';
    const inputs = analysisForm.querySelectorAll('input, textarea, button');
    inputs.forEach(input => input.disabled = false);
}

// Mostrar resultados
function displayResults(result) {
    enableForm();
    resultsCard.style.display = 'block';

    // Documentação
    const docContent = document.getElementById('documentationContent');
    if (result.documentation) {
        docContent.innerHTML = `<pre>${escapeHtml(result.documentation)}</pre>`;
    } else {
        docContent.innerHTML = '<p class="empty-state">Documentação não gerada</p>';
    }

    // Code Review
    const reviewContent = document.getElementById('reviewContent');
    if (result.code_review) {
        reviewContent.innerHTML = `<pre>${escapeHtml(result.code_review)}</pre>`;
    } else {
        reviewContent.innerHTML = '<p class="empty-state">Code review não gerado</p>';
    }

    // Dados da Issue
    const issueData = document.getElementById('issueData');
    if (result.issue_data) {
        issueData.textContent = JSON.stringify(result.issue_data, null, 2);
    } else {
        issueData.textContent = 'Nenhuma issue Jira fornecida';
    }

    // Dados do PR
    const prData = document.getElementById('prData');
    if (result.pr_data) {
        // Simplificar dados do PR para exibição
        const simplifiedPR = {
            title: result.pr_data.basic?.title,
            description: result.pr_data.basic?.description,
            createdBy: result.pr_data.basic?.createdBy?.displayName,
            sourceRefName: result.pr_data.basic?.sourceRefName,
            targetRefName: result.pr_data.basic?.targetRefName,
            status: result.pr_data.basic?.status,
            totalCommits: result.pr_data.commits?.count || 0,
            totalFiles: result.pr_data.files?.length || 0
        };
        prData.textContent = JSON.stringify(simplifiedPR, null, 2);
    }

    // Scroll para os resultados
    resultsCard.scrollIntoView({ behavior: 'smooth' });
}

// Escape HTML para evitar XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        // Remover active de todos
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Adicionar active ao clicado
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});
