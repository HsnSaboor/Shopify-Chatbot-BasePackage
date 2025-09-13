# MCP Tools Usage Rules for AI Development

## 📋 Complete MCP Server Reference

### Currently Configured MCP Servers:

| Server | Command/URL | Purpose | Key Tools |
|--------|-------------|---------|----------|
| **sequential-thinking** | `npx @modelcontextprotocol/server-sequential-thinking` | Complex problem-solving | `sequentialthinking` |
| **playwright** | `npx @playwright/mcp@latest` | Browser automation | 25+ tools (navigate, click, type, etc.) |
| **fetch** | `uvx mcp-server-fetch` | Web content retrieval | `fetch` |
| **shadcn** | `npx shadcn@latest mcp` | UI component management | `search_items`, `view_items`, `get_examples` |
| **gitmcp** | `https://gitmcp.io/{owner}/{repo}` | GitHub documentation hub | `fetch_documentation`, `search_code` |
| **Ref** | `npx ref-tools-mcp@latest` | Precision documentation search | `ref_search_documentation`, `ref_read_url` |

### MCP Server Capabilities Matrix:

| Capability | Sequential | Playwright | Fetch | ShadCN | GitMCP | Ref |
|------------|------------|------------|-------|--------|--------|---------|
| Problem Analysis | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Browser Automation | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Web Content Fetch | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| UI Components | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| GitHub Access | ❌ | ❌ | ❌ | ❌ | ✅ | ✅* |
| Private Docs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Token Optimization | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Session Tracking | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

*Ref can access private GitHub repositories with proper authentication

---

## Available MCP Servers & Their Tools

### 1. Sequential-Thinking MCP
**Purpose**: Complex problem-solving and analytical thinking
**Tools**: `sequentialthinking` - Dynamic thought process management
**When to use**: Multi-step analysis, planning, debugging complex issues, architectural decisions

### 2. Playwright MCP 
**Purpose**: Browser automation and web testing
**Key Tools**: 
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Capture page state via accessibility tree
- `browser_click` - Click elements
- `browser_type` - Type text into fields
- `browser_fill_form` - Fill multiple form fields
- `browser_take_screenshot` - Capture visual screenshots
- `browser_evaluate` - Execute JavaScript
- `browser_wait_for` - Wait for conditions
**When to use**: Web scraping, testing UI components, form automation, browser-based tasks

### 3. Fetch MCP
**Purpose**: Web content retrieval and conversion
**Tools**: `fetch` - Retrieve and convert web content for LLM processing
**When to use**: Getting documentation, fetching API responses, retrieving web-based resources

### 4. ShadCN MCP
**Purpose**: UI component management and installation
**Key Tools**:
- `get_project_registries` - List configured registries
- `search_items_in_registries` - Find components by search
- `view_items_in_registries` - Get component details
- `get_item_examples_from_registries` - Find usage examples
- `get_add_command_for_items` - Get CLI commands for installation
**When to use**: Building React/Next.js UIs, finding components, installing shadcn/ui components

### 5. GitMCP
**Purpose**: Remote GitHub documentation and code access for AI context
**Key Tools**:
- `fetch_documentation` - Retrieve documentation from GitHub repositories
- `search_documentation` - Search through repository documentation
- `search_code` - Search code within repositories  
- `fetch_generic_url_content` - Fetch referenced content from URLs
**When to use**: Accessing latest docs from any GitHub repo, understanding unfamiliar codebases, getting current API examples

### 6. Ref MCP
**Purpose**: Token-efficient documentation search and anti-hallucination tool
**Key Tools**:
- `ref_search_documentation` - Search technical documentation (public/private)
- `ref_read_url` - Fetch and convert URLs to markdown
**When to use**: Finding accurate API docs, searching private repos/PDFs, getting precise code snippets, avoiding hallucinations
**Special Features**: Session tracking, result filtering, smart context extraction (5k token limit)

## Development Rules

### Rule 1: Complex Problem Solving
**ALWAYS use Sequential-Thinking MCP for:**
- Multi-step architectural decisions
- Debugging complex issues with multiple potential causes
- Planning feature implementations
- Analyzing trade-offs between different approaches
- Breaking down large tasks into smaller components

### Rule 2: Web-Based Development
**Use Playwright MCP when:**
- Testing web applications
- Automating browser interactions
- Scraping content from websites
- Filling forms programmatically
- Taking screenshots for documentation
- Validating UI behavior
**Before using**: Ensure Chrome is installed (`npx playwright install chrome`)

### Rule 3: Research and Documentation
**Use Fetch MCP to:**
- Retrieve latest documentation from official sources
- Get API documentation and examples
- Fetch error solutions from Stack Overflow or GitHub issues
- Access technical articles and guides
**Always prioritize**: Official documentation over third-party sources

### Rule 4: UI Component Development
**Use ShadCN MCP when:**
- Building React/Next.js applications
- Looking for pre-built components
- Need examples of component usage
- Installing shadcn/ui components
**Process**: Search → View → Get Examples → Install

### Rule 5: GitHub Documentation & Code Access
**Use GitMCP for:**
- Accessing up-to-date documentation from ANY GitHub repository
- Searching code examples in specific repositories
- Understanding APIs and libraries you've never worked with
- Getting accurate, non-hallucinated code examples
- Reading llms.txt, README.md, and other project documentation
**Configuration**: Use `gitmcp.io/{owner}/{repo}` or `{owner}.gitmcp.io/{repo}` for specific repos, or `gitmcp.io/docs` for dynamic access

### Rule 6: Precision Documentation Search
**Use Ref MCP for:**
- Finding exact API documentation and code snippets
- Searching private GitHub repositories and PDFs
- Getting token-efficient, relevant documentation context
- Avoiding documentation hallucinations
- Multi-step refined searches with session tracking
**Key Advantage**: Smart context extraction (max 5k tokens) with session-aware filtering

## Web Search Integration Rules

### Rule 6: Documentation First
**ALWAYS search web for:**
- Latest official documentation when encountering new libraries/frameworks
- Current best practices and updated examples
- Recent error solutions and fixes
- Breaking changes and migration guides

### Rule 7: Error Resolution Protocol
**When encountering errors:**
1. Use `search_web` to find latest solutions
2. Prioritize: Official docs → GitHub issues → Stack Overflow → Technical blogs  
3. Use `fetch` tool to get detailed content from relevant URLs
4. Apply Sequential-Thinking MCP to analyze multiple solutions

### Rule 8: Technology Updates
**Before using any tool or library:**
1. Search web for latest version and documentation
2. Check for recent updates, deprecations, or security issues
3. Verify compatibility with current project dependencies

### Rule 9: Best Practices Research
**Regularly search for:**
- Current industry best practices
- Performance optimization techniques
- Security considerations
- Accessibility guidelines
- Testing strategies

## Workflow Integration Rules

### Rule 10: MCP Combination Strategies
**For comprehensive solutions:**
- **Plan** with Sequential-Thinking → **Research** with Fetch/Web Search → **Implement** with appropriate MCP → **Test** with Playwright
- **Research** with GitMCP → **Analyze** with Sequential-Thinking → **Enhance** with ShadCN/Playwright

### Rule 11: Fallback Protocols
**If primary MCP fails:**
1. Search web for alternative solutions
2. Use Fetch MCP to get documentation
3. Apply Sequential-Thinking to find workarounds
4. Document the issue and solution

### Rule 12: Performance Optimization
**Use MCPs efficiently:**
- Batch similar operations when possible
- Cache frequently accessed information
- Use appropriate MCP for each task type
- Avoid redundant web searches

## Quality Assurance Rules

### Rule 13: Validation Requirements
**Always validate:**
- Component installations work correctly (ShadCN)
- Browser automation scripts function as expected (Playwright)
- Fetched documentation is current and accurate (Fetch)
- Complex solutions are logically sound (Sequential-Thinking)

### Rule 14: Testing Integration
**Use Playwright MCP to:**
- Create automated tests for UI components
- Validate form submissions and user interactions
- Test responsive design across different viewport sizes
- Capture screenshots for visual regression testing

### Rule 15: Documentation Standards
**When creating solutions:**
- Document which MCPs were used and why
- Include links to relevant documentation found via web search
- Provide examples of MCP tool usage
- Note any limitations or known issues

## Emergency Protocols

### Rule 16: Critical Error Handling
**For blocking issues:**
1. Use Sequential-Thinking MCP to break down the problem
2. Search web immediately for known solutions
3. Use Fetch MCP to get detailed error documentation  
4. Try alternative approaches if primary solution fails
5. Document the resolution process

### Rule 17: Dependency Issues
**When encountering dependency conflicts:**
1. Search web for latest compatibility information
2. Use Sequential-Thinking MCP to analyze impact
3. Fetch official migration guides
4. Test solutions with Playwright if web-related

## GitMCP Specific Rules

### Rule 21: Anti-Hallucination Protocol
**ALWAYS use GitMCP when:**
- Working with libraries/frameworks you're unfamiliar with
- Need current API documentation and examples
- Want to avoid code hallucinations
- Implementing features from specific GitHub projects
**Process**: `fetch_documentation` → `search_code` for examples → implement with confidence

### Rule 22: Repository Selection Strategy
**Choose GitMCP URL format based on usage:**
- **Specific Repository**: `gitmcp.io/{owner}/{repo}` - Use when focusing on one project
- **GitHub Pages**: `{owner}.gitmcp.io/{repo}` - For documentation sites
- **Dynamic Access**: `gitmcp.io/docs` - When switching between multiple repositories
**Security**: Specific repositories prevent unintended access

### Rule 23: Documentation Hierarchy
**GitMCP reads files in this priority:**
1. `llms.txt` - AI-specific instructions
2. `llms-full.txt` - Comprehensive AI context
3. `README.md` - Project overview
4. Documentation folder contents
5. Code files and comments
**Tip**: Always check if project has `llms.txt` for AI-optimized guidance

### Rule 24: Code Search Optimization
**Use GitMCP code search for:**
- Finding implementation patterns
- Locating specific functions or classes
- Understanding usage examples
- Discovering edge cases and error handling
**Best Practice**: Combine with `search_documentation` for complete context



## Continuous Improvement

### Rule 25: Ref MCP Precision Search Protocol
**Use Ref MCP as primary documentation tool for:**
- API endpoint documentation and parameters
- Code snippet examples with exact syntax
- Private repository documentation access
- PDF technical documentation search
- Token-efficient context retrieval (max 5k tokens per read)
**Search Strategy**: Start broad, then refine with session-aware filtering
**Workflow**: `ref_search_documentation` → `ref_read_url` for detailed content

### Rule 26: Documentation Tool Hierarchy
**Priority order for documentation access:**
1. **Ref MCP** - For precise, token-efficient searches (public/private docs)
2. **GitMCP** - For GitHub repository-specific documentation  
3. **Fetch MCP** - For general web content and broad research
4. **Web Search** - For latest updates and community solutions
**Cost Consideration**: Ref optimizes token usage, reducing API costs significantly


### Rule 27: Learning Integration
- Searching for new MCP servers and tools
- Staying updated on MCP best practices
- Learning from community examples and use cases
- Experimenting with new tool combinations

### Rule 28: Knowledge Sharing
**Document and share:**
- Successful MCP usage patterns
- Effective tool combinations
- Solutions to common problems
- Performance optimization discoveries

### Rule 29: Monitoring and Maintenance
**Regularly:**
- Check for MCP server updates
- Verify tool functionality
- Update configurations as needed
- Review and refine usage patterns

---

## Quick Reference Commands

### Essential Web Searches
```
# Search for latest documentation
search_web "[technology] official documentation 2024 latest"

# Find error solutions
search_web "[error_message] solution fix 2024"

# Get best practices
search_web "[technology] best practices current trends"
```

### MCP Tool Combinations
```
# Precision Research → Plan → Implement
1. ref_search_documentation + gitmcp (precise research)
2. mcp_sequential-thinking (plan)
3. mcp_shadcn + mcp_playwright (implement)

# Debug → Analyze → Fix
1. ref_search_documentation + search_web (find solutions)
2. mcp_sequential-thinking (analyze)
3. mcp_playwright (test fixes)

# Anti-Hallucination Workflow
1. ref_search_documentation (get precise docs)
2. ref_read_url (detailed context)
3. gitmcp_search_code (find real examples)
4. mcp_sequential-thinking (plan implementation)
5. implement with confidence

# Token-Efficient Documentation Access
1. ref_search_documentation (smart 5k token context)
2. session-aware filtering (no repeated results)
3. targeted ref_read_url (specific sections)
```

**Remember**: These MCPs are powerful tools - use them strategically, always search for the latest information, and combine them effectively for optimal development outcomes.