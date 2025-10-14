# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-Powered PR Analyzer - A Python tool that integrates Jira, Azure DevOps, and AI (Claude, OpenAI GPT-4, or Ollama) to automatically generate technical documentation and code reviews for Pull Requests.

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

Create a `.env` file in the root directory:

```env
# Jira (optional)
JIRA_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token

# Azure DevOps (required)
AZDO_ORGANIZATION=your-organization
AZDO_PROJECT=your-project
AZDO_PAT=your_personal_access_token

# AI Provider (choose ONE):
# Option 1: Claude
ANTHROPIC_API_KEY=your_anthropic_key

# Option 2: OpenAI
OPENAI_API_KEY=your_openai_key

# Option 3: Ollama (local - no key needed)
# Just install and run: ollama serve
```

### Run Analysis

**Option 1: Web Interface (Recommended)**

```bash
python app.py
```

Then open `http://localhost:5001` in your browser.

**Option 2: Command Line**

Edit configuration in `main.py`, then run:

```bash
python main.py
```

## Architecture

The application has two interfaces:

### Web Interface (`app.py`)
- Flask web server with real-time updates via WebSocket (Socket.IO)
- Modern responsive UI for configuring and running analyses
- Live progress tracking with visual feedback
- Tabbed results display (Documentation, Code Review, Raw Data)
- Configuration testing before running analysis

### Command Line (`main.py`)
- Direct script execution with hardcoded configuration
- Suitable for automation and CI/CD pipelines

### Core Modules

The application consists of 4 main modules:

### 1. `jira_client.py` - Jira Integration
- Fetches issue data from Jira REST API
- Extracts summary and description
- Handles authentication via email + API token

### 2. `azdo_client.py` - Azure DevOps Integration
- Fetches Pull Request data
- Retrieves commits and file diffs
- Extracts added/modified lines of code
- Uses PAT (Personal Access Token) for authentication

### 3. `ai_analyzer.py` - AI Analysis Engine
- Auto-detects available AI provider (Claude → OpenAI → Ollama)
- Generates technical documentation
- Generates code reviews
- Supports custom prompts

**Provider Priority:**
1. **Claude** (`ANTHROPIC_API_KEY`): Uses `claude-3-5-sonnet-20250219`
2. **OpenAI** (`OPENAI_API_KEY`): Uses `gpt-4o`
3. **Ollama** (local): Uses `llama3.2:3b` if running on `http://localhost:11434`

### 4. `main.py` - Workflow Orchestrator
- Main entry point and configuration
- `WorkflowOrchestrator` class coordinates all modules
- Handles the complete analysis pipeline:
  1. Fetch Jira issue (optional)
  2. Fetch PR data from Azure DevOps
  3. Generate documentation (if enabled)
  4. Generate code review (if enabled)
  5. Save results to files

## Configuration in main.py

Edit these variables at the top of `main.py`:

```python
# Required
REPO = "YourRepoName"         # Azure DevOps repository name
PR_ID = 12345                 # Pull Request ID number

# Optional
ISSUE_KEY = "PROJ-123"        # Jira issue key (or None)

# What to generate
GENERATE_DOCUMENTATION = True  # Generate technical documentation
GENERATE_CODE_REVIEW = True    # Generate code review

# Custom prompts (optional)
CUSTOM_CODE_REVIEW_PROMPT = None     # Custom prompt for code review
CUSTOM_DOCUMENTATION_PROMPT = None   # Custom prompt for documentation
```

## Output Files

After running, the following files are generated:

- `issue_data.json` - Jira issue data (if issue key provided)
- `pr_commits.json` - Pull Request commits
- `pr_files_content.json` - Modified files with diffs
- `DOCUMENTATION.md` - AI-generated technical documentation
- `CODE_REVIEW.md` - AI-generated code review

## Module Usage Examples

### Using Jira Client Standalone

```python
from jira_client import JiraClient

client = JiraClient()
issue_data = client.get_issue_summary_only("PROJ-123")
print(issue_data['summary'])
```

### Using Azure DevOps Client Standalone

```python
from azdo_client import AzureDevOpsClient

client = AzureDevOpsClient()
pr_data = client.get_pull_request("RepoName", 123)
commits = client.get_pr_commits("RepoName", 123)
```

### Using AI Analyzer Standalone

```python
from ai_analyzer import AIAnalyzer

analyzer = AIAnalyzer()  # Auto-detects provider

# Generate documentation
doc = analyzer.generate_documentation(
    issue_data,
    pr_data,
    custom_prompt="Focus on API changes..."
)

# Generate code review
review = analyzer.generate_code_review(
    pr_data,
    custom_prompt="Focus on security..."
)
```

## Key Implementation Details

### AI Provider Auto-Detection
The `AIAnalyzer` class attempts to initialize providers in order:
1. Checks for `ANTHROPIC_API_KEY` and imports `anthropic` package
2. Checks for `OPENAI_API_KEY` and imports `openai` package
3. Tests for Ollama by checking `http://localhost:11434/api/tags`
4. Raises error if no provider available

### Data Formatting
The `data_formatter.py` module formats raw API responses into clean text prompts for AI analysis. It extracts:
- Jira issue summary and description
- PR title, description, and author
- Commit messages
- File diffs with added/modified lines only

### Error Handling
- All API clients handle authentication errors and network issues
- Missing optional Jira data doesn't stop PR analysis
- Custom prompts override default behavior

## Dependencies

```
requests==2.31.0         # HTTP requests for APIs
python-dotenv==1.0.0     # Environment variable loading
anthropic==0.39.0        # Claude API (optional)
flask==3.0.0             # Web framework
flask-socketio==5.3.5    # WebSocket support
python-socketio==5.10.0  # Socket.IO server
```

Additional optional dependencies:
- `openai` - for OpenAI GPT-4 (install: `pip install openai`)
- `requests` - for Ollama local API (already required)

## Common Workflows

### Using Web Interface

1. Start the server: `python app.py`
2. Open browser: `http://localhost:5001`
3. Fill in the form:
   - **Repository** and **PR ID** (required)
   - **Jira Issue Key** (optional)
   - Check/uncheck what to generate
   - Add custom prompts if needed
4. Click "🚀 Iniciar Análise"
5. Watch real-time progress
6. View results in tabs (Documentation / Code Review / Data)

### Using Command Line

#### Full Analysis with Jira Issue
Set `ISSUE_KEY`, `REPO`, `PR_ID` and both generate flags to `True` in `main.py`, then run `python main.py`.

#### PR-Only Analysis (No Jira)
Set `ISSUE_KEY = None` in `main.py`, configure `REPO` and `PR_ID`, then run.

#### Documentation Only
Set `GENERATE_CODE_REVIEW = False` in `main.py`.

#### Code Review Only
Set `GENERATE_DOCUMENTATION = False` in `main.py`.

#### Custom Analysis Focus
Set `CUSTOM_CODE_REVIEW_PROMPT` or `CUSTOM_DOCUMENTATION_PROMPT` with specific instructions like:
```python
CUSTOM_CODE_REVIEW_PROMPT = """
Analyze focusing on:
- Security vulnerabilities
- Performance issues
- Test coverage
"""
```

## Web Interface Features

- **Configuration Testing**: Automatically tests Jira, Azure DevOps, and AI provider connections on page load
- **Real-Time Progress**: WebSocket updates show progress from 0-100% with status messages
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Handling**: Clear error messages with suggestions
- **Results Display**: Formatted markdown-style output with tabs for easy navigation

## Testing Configuration

To test API connections without running a full analysis:

**Web Interface:**
- Open `http://localhost:5001` and check the status indicators at the top of the page
- Green = configured and working, Red = missing or error

**Command Line:**
Test individual components in Python:
```python
from jira_client import JiraClient
from azdo_client import AzureDevOpsClient
from ai_analyzer import AIAnalyzer

# Test Jira (if configured)
jira = JiraClient()
issue = jira.get_issue_summary_only("TEST-123")

# Test Azure DevOps
azdo = AzureDevOpsClient()
pr = azdo.get_pull_request("RepoName", 123)

# Test AI Provider (auto-detects available provider)
ai = AIAnalyzer()
print(f"Using AI provider: {ai.provider}")
```

## Important Implementation Notes

### WorkflowOrchestrator Classes
There are two orchestrator classes with slightly different behaviors:

1. **`WorkflowOrchestrator`** in [main.py](main.py) - Command-line version that prints progress to stdout
2. **`WebWorkflowOrchestrator`** in [app.py](app.py) - Web version that emits WebSocket events for real-time UI updates

Both use the same core clients but handle progress reporting differently.

### Data Flow
1. Clients ([jira_client.py](jira_client.py), [azdo_client.py](azdo_client.py)) fetch raw API data
2. [data_formatter.py](data_formatter.py) formats raw data into text prompts
3. [ai_analyzer.py](ai_analyzer.py) sends formatted prompts to AI provider
4. Results are saved as markdown files

### Environment Variables
The `.env` file must be in the project root. Use [.env.example](.env.example) as a template if available.
