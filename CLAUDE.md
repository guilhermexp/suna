# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Project Setup
```bash
# Initial project setup using wizard
python setup.py

# Start/stop all services (after setup)
python start.py

# Manual backend development (start dependencies first)
docker compose up redis rabbitmq -d
cd backend && uv run api.py                     # API server
cd backend && uv run dramatiq run_agent_background  # Background worker

# Frontend development
cd frontend && npm run dev
```

### Backend Development
```bash
# API server
cd backend && uv run api.py

# Background worker for agent tasks
cd backend && uv run dramatiq --processes 4 --threads 4 run_agent_background

# Feature flags management
cd backend/flags && python setup.py enable custom_agents "Description"
cd backend/flags && python setup.py list
cd backend/flags && python test_flags.py

# Container services
docker compose up redis rabbitmq    # Dependencies only
docker compose up --build          # Full backend rebuild
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev        # Development server with Turbopack
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier formatting
```

## Architecture Overview

### Core System Design
Suna is built as a modular AI agent platform with clear separation between frontend, backend, agent execution, and data persistence layers.

**Key Architectural Patterns:**
- **Domain-Driven Design**: Each major feature area (credentials, templates, triggers, etc.) is organized as a self-contained domain with entities, repositories, services, and facades
- **Repository Pattern**: Database interactions are abstracted through repository interfaces with Supabase implementations
- **Tool Registry System**: Agent capabilities are modular tools registered through a centralized registry
- **Event-Driven Workflows**: Background job processing via Dramatiq for agent execution
- **Secure Execution Environment**: Isolated agent execution through Daytona containers

### Backend Module Organization

**AgentPress Core** (`backend/agentpress/`):
- `ThreadManager`: Orchestrates conversation threads, LLM interactions, and tool execution
- `ToolRegistry`: Central registry for agent tools with OpenAPI and XML schema support
- `ContextManager`: Handles conversation context and token management
- `ResponseProcessor`: Processes LLM responses and extracts tool calls

**Domain Modules** (following DDD pattern):
- `credentials/`: Secure credential management with encryption for MCP servers
- `templates/`: Agent marketplace and template system
- `triggers/`: Automated task scheduling and webhook handling
- `pipedream/`: Workflow automation and API connections
- `mcp_module/`: Model Context Protocol integration for external tools

**Agent Tools** (`backend/agent/tools/`):
- Modular tool system where each tool inherits from base `Tool` class
- Tools include browser automation, file operations, shell commands, web search
- MCP tool wrapper for external Model Context Protocol servers
- Agent builder tools for dynamic agent configuration

**Service Layer** (`backend/services/`):
- `llm.py`: LLM provider abstraction (Anthropic, OpenAI, etc.)
- `supabase.py`: Database connection and query management
- `redis.py`: Caching and session management
- `billing.py`: Usage tracking and billing integration

### Frontend Architecture

**Next.js App Router Structure** (`frontend/src/app/`):
- `(dashboard)/`: Main application with nested routes for agents, settings
- `(home)/`: Marketing pages and public content
- `api/`: Server-side API routes and webhook handlers

**Component Organization** (`frontend/src/components/`):
- `agents/`: Agent management, configuration, and chat interface
- `thread/`: Chat UI, message handling, and tool result visualization
- `billing/`: Usage tracking and payment components
- Feature-specific components grouped by domain

**State Management**:
- React Query for server state and caching
- Zustand for client-side state management
- Supabase client for real-time subscriptions

### Data Flow Architecture

**Agent Execution Flow**:
1. User message → ThreadManager → LLM API call
2. LLM response → ResponseProcessor → Tool extraction
3. Tool execution → Agent sandbox (Daytona) → Tool results
4. Results → Context update → Next LLM iteration

**Tool Registration Pattern**:
```python
# Tools inherit from base Tool class with schema generation
class ExampleTool(Tool):
    def get_schemas(self) -> Dict[str, SchemaType]:
        # Returns both OpenAPI and XML schemas
        
# Registration in ToolRegistry with selective function filtering
registry.register_tool(ExampleTool, function_names=["specific_function"])
```

**Database Pattern** (Domain modules):
```
domain/
├── entities.py      # Domain objects
├── repositories.py  # Abstract interfaces  
├── services.py      # Business logic
└── value_objects.py # Immutable values

repositories/
└── supabase_*.py    # Concrete implementations

facade.py            # Public API for domain
```

### Environment Configuration

**Backend** (`.env` in backend/):
- Database: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- LLM Providers: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `MODEL_TO_USE`
- Infrastructure: `REDIS_HOST`, `RABBITMQ_HOST`, `DAYTONA_API_KEY`
- External APIs: `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, `QSTASH_TOKEN`

**Frontend** (`.env.local` in frontend/):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_ENV_MODE`

### Key Integration Points

**MCP (Model Context Protocol)**:
- External tool integration through standardized protocol
- Credential management for secure tool access
- Dynamic tool discovery and registration

**Supabase Integration**:
- Row Level Security for multi-tenant data isolation
- Real-time subscriptions for live updates
- Basejump framework for team/account management

**Agent Sandbox (Daytona)**:
- Isolated execution environment for each agent
- Browser automation via Playwright
- File system access with security boundaries

### Development Patterns

**Error Handling**: Graceful degradation with Redis/external service failures
**Security**: Credential encryption, sandbox isolation, RLS policies
**Observability**: Structured logging with Langfuse tracing
**Modularity**: Domain separation, tool registry, facade pattern
**Testing**: Feature flags for controlled rollouts (`backend/flags/`)