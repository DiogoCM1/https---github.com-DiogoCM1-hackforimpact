from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
import os
import json
import threading
from jira_client import JiraClient
from azdo_client import AzureDevOpsClient
from ai_analyzer import AIAnalyzer
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
socketio = SocketIO(app, cors_allowed_origins="*")

class WebWorkflowOrchestrator:
    """Orquestrador com suporte para updates em tempo real via WebSocket"""

    def __init__(self, socket_id):
        self.socket_id = socket_id
        self.jira_client = JiraClient()
        self.azdo_client = AzureDevOpsClient()
        self.ai_analyzer = AIAnalyzer()
        self.default_repo = os.getenv('AZDO_REPO', 'MedicineOneLibrary')

    def emit_progress(self, message, progress):
        """Envia progresso para o cliente via WebSocket"""
        socketio.emit('progress', {
            'message': message,
            'progress': progress
        }, room=self.socket_id)

    def run_analysis(self, pr_id, repository=None, issue_key=None,
                     generate_documentation=True,
                     generate_code_review=True):
        """Executa análise completa com updates de progresso"""

        repo = repository or self.default_repo

        try:
            result = {
                'issue_data': None,
                'pr_data': None,
                'documentation': None,
                'code_review': None
            }

            # Step 1: Buscar Jira (se fornecido)
            if issue_key:
                self.emit_progress(f'Buscando issue {issue_key} do Jira...', 10)
                issue_data = self.jira_client.get_issue_summary_only(issue_key)
                if issue_data:
                    result['issue_data'] = issue_data
                    self.emit_progress(f'✓ Issue {issue_key} obtida', 20)
                else:
                    self.emit_progress(f'⚠ Não foi possível obter issue {issue_key}', 20)
            else:
                self.emit_progress('Pulando busca do Jira (sem issue key)', 20)

            # Step 2: Buscar PR
            self.emit_progress(f'Buscando PR #{pr_id} do {repo}...', 30)
            pr_basic = self.azdo_client.get_pull_request(repo, pr_id)

            if not pr_basic:
                raise Exception(f'Erro ao buscar PR #{pr_id}')

            self.emit_progress(f'Buscando commits do PR...', 40)
            commits = self.azdo_client.get_pr_commits(repo, pr_id)

            self.emit_progress(f'Buscando ficheiros alterados...', 50)
            files_content = self.azdo_client.get_pr_added_lines_only(repo, pr_id)

            pr_data = {
                'basic': pr_basic,
                'commits': commits,
                'files': files_content
            }
            result['pr_data'] = pr_data
            self.emit_progress(f'✓ Dados do PR obtidos', 60)

            # Preparar dados para IA (formato esperado pelo ai_analyzer)
            combined_data = {
                'pr_commits.json': commits,
                'pr_files_content.json': files_content
            }
            if result['issue_data']:
                combined_data['issue_data.json'] = result['issue_data']

            # Step 3: Gerar documentação
            if generate_documentation:
                self.emit_progress('Gerando documentação técnica com IA...', 70)
                documentation = self.ai_analyzer.generate_documentation(combined_data)
                result['documentation'] = documentation
                self.emit_progress('✓ Documentação gerada', 80)

            # Step 4: Gerar code review
            if generate_code_review:
                self.emit_progress('Gerando code review com IA...', 85)
                code_review = self.ai_analyzer.generate_code_review(combined_data)
                result['code_review'] = code_review
                self.emit_progress('✓ Code review gerado', 95)

            self.emit_progress('✓ Análise concluída!', 100)

            # Enviar resultado final
            socketio.emit('analysis_complete', result, room=self.socket_id)

        except Exception as e:
            error_msg = f'Erro: {str(e)}'
            self.emit_progress(error_msg, -1)
            socketio.emit('analysis_error', {'error': str(e)}, room=self.socket_id)


@app.route('/')
def index():
    """Página principal"""
    default_repo = os.getenv('AZDO_REPO', 'MedicineOneLibrary')
    return render_template('index.html', default_repo=default_repo)


@socketio.on('connect')
def handle_connect():
    """Cliente conectado"""
    print(f'Cliente conectado: {request.sid}')


@socketio.on('disconnect')
def handle_disconnect():
    """Cliente desconectado"""
    print(f'Cliente desconectado: {request.sid}')


@socketio.on('start_analysis')
def handle_start_analysis(data):
    """Inicia análise em background"""
    print(f'Análise iniciada por: {request.sid}')
    print(f'Dados: {data}')

    # Validar dados
    pr_id = data.get('pr_id')

    if not pr_id:
        emit('analysis_error', {'error': 'PR ID é obrigatório'})
        return

    # Criar orquestrador
    orchestrator = WebWorkflowOrchestrator(request.sid)

    # Executar em thread separada
    thread = threading.Thread(
        target=orchestrator.run_analysis,
        kwargs={
            'pr_id': int(pr_id),
            'repository': data.get('repository') or None,
            'issue_key': data.get('issue_key') or None,
            'generate_documentation': data.get('generate_documentation', True),
            'generate_code_review': data.get('generate_code_review', True)
        }
    )
    thread.daemon = True
    thread.start()


@app.route('/api/config/test', methods=['GET'])
def test_config():
    """Testa configuração das APIs"""
    results = {
        'jira': False,
        'azure_devops': False,
        'ai_provider': None
    }

    try:
        jira_client = JiraClient()
        results['jira'] = jira_client.test_connection()
    except:
        pass

    try:
        azdo_client = AzureDevOpsClient()
        results['azure_devops'] = True if azdo_client.organization else False
    except:
        pass

    try:
        ai_analyzer = AIAnalyzer()
        results['ai_provider'] = ai_analyzer.provider
    except:
        pass

    return jsonify(results)


if __name__ == '__main__':
    print('=' * 80)
    print('AI-Powered PR Analyzer - Web Interface')
    print('=' * 80)
    print('Servidor iniciado em: http://localhost:5001')
    print('=' * 80)
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
