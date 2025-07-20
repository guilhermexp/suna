# Feature Flags for Self-Hosting

This directory contains the feature flag management system for Suna. When running in a self-hosted environment, certain features that are typically restricted in the cloud version need to be enabled.

## Automatic Flag Initialization

When the backend starts up, it automatically detects if it's running in a self-hosted environment and enables all necessary feature flags. This happens through:

1. **Environment Detection**: The system checks for the `SELF_HOSTED=true` environment variable or the absence of cloud provider indicators (Vercel, Netlify, etc.)
2. **Automatic Enablement**: If self-hosting is detected, all required feature flags are automatically enabled

## Manual Flag Management

You can also manually manage feature flags using the provided scripts:

### Enable All Self-Hosting Flags

```bash
cd backend/flags
python enable_self_hosting_flags.py
```

This will enable all features required for self-hosting:
- `custom_agents` - Custom agent creation and management
- `agent_marketplace` - Agent marketplace for sharing agents
- `knowledge_base` - Knowledge base feature for agents
- `agent_triggers` - Agent triggers for automated workflows

### Individual Flag Management

Use the `setup.py` script for granular control:

```bash
# Enable a specific flag
python setup.py enable <flag_name> "Description"

# Disable a specific flag
python setup.py disable <flag_name>

# List all flags and their status
python setup.py list

# Check status of a specific flag
python setup.py status <flag_name>

# Toggle a flag
python setup.py toggle <flag_name>

# Delete a flag
python setup.py delete <flag_name>
```

## Setting Environment Variable

To ensure automatic flag initialization on startup, set the environment variable:

```bash
# In your .env file or environment
SELF_HOSTED=true
```

## Troubleshooting

1. **Flags not enabled automatically**: Check that Redis is running and accessible
2. **Manual enablement fails**: Ensure you have proper Redis connection configured
3. **Features still disabled**: Clear frontend cache and restart both backend and frontend services

## Adding New Feature Flags

To add a new feature flag that should be enabled for self-hosting:

1. Add it to the `SELF_HOSTING_FLAGS` list in both:
   - `enable_self_hosting_flags.py`
   - `init_flags.py`
2. Update this README with the new flag description