# GEMINI.md

🚨 Core Rule (Read First)

The Gemini agent must always use the appropriate MCP server/tool automatically without asking the user for permission whenever the task requires it.

No confirmation needed.

No skipping MCP usage.

If multiple MCPs apply, select the most precise one (see hierarchy rules below).

Only if no MCP is suitable, fall back to web search or reasoning.

This rule overrides all others. MCPs are the default, not optional.

## MCP Tools Usage Rules for AI Development

This file defines how the **Gemini AI agent** must use MCP (Model Context Protocol) servers and tools during development. It prevents hallucinations, enforces correct tool use, and ensures high-quality results.

---

## 📋 Complete MCP Server Reference

### Currently Configured MCP Servers

| Server              | Command/URL                          | Purpose                        | Key Tools                                  |
| ------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------ |
| sequential-thinking | `npx mcp-server-sequential-thinking` | Complex problem-solving        | sequentialthinking                         |
| playwright          | `npx playwright-mcp@latest`          | Browser automation             | 25+ tools (navigate, click, type, etc.)    |
| fetch               | `uvx mcp-server-fetch`               | Web content retrieval          | fetch                                      |
| shadcn              | `npx shadcn@latest mcp`              | UI component management        | search\_items, view\_items, get\_examples  |
| gitmcp              | `https://gitmcp.io/{owner}/{repo}`   | GitHub documentation hub       | fetch\_documentation, search\_code         |
| Ref                 | `npx ref-tools-mcp@latest`           | Precision documentation search | ref\_search\_documentation, ref\_read\_url |

---

### MCP Server Capabilities Matrix

| Capability         | Sequential | Playwright | Fetch | ShadCN | GitMCP | Ref |
| ------------------ | ---------- | ---------- | ----- | ------ | ------ | --- |
| Problem Analysis   | ✅          | ❌          | ❌     | ❌      | ❌      | ❌   |
| Browser Automation | ❌          | ✅          | ❌     | ❌      | ❌      | ❌   |
| Web Content Fetch  | ❌          | ❌          | ✅     | ❌      | ❌      | ✅   |
| UI Components      | ❌          | ❌          | ❌     | ✅      | ❌      | ❌   |
| GitHub Access      | ❌          | ❌          | ❌     | ❌      | ✅      | ✅\* |
| Private Docs       | ❌          | ❌          | ❌     | ❌      | ❌      | ✅   |
| Token Optimization | ❌          | ❌          | ❌     | ❌      | ❌      | ✅   |
| Session Tracking   | ✅          | ❌          | ❌     | ❌      | ❌      | ✅   |

\*Ref can access private GitHub repositories with proper authentication.

---

## Available MCP Servers & Their Tools

### 1. Sequential-Thinking MCP

* **Purpose:** Complex problem solving, multi-step reasoning.
* **Tools:** `sequentialthinking`
* **When to use:**

  * Multi-step analysis & planning
  * Debugging complex issues
  * Architectural decisions & trade-offs
  * Breaking large tasks into smaller steps

---

### 2. Playwright MCP

* **Purpose:** Browser automation and testing.
* **Key Tools:**

  * `browser_navigate` → Go to URL
  * `browser_snapshot` → Capture accessibility tree
  * `browser_click` → Click elements
  * `browser_type` → Enter text
  * `browser_fill_form` → Fill forms
  * `browser_take_screenshot` → Capture screenshots
  * `browser_evaluate` → Execute JS
  * `browser_wait_for` → Wait for conditions
* **When to use:** UI automation, scraping, testing, form submissions, screenshots.
* **Pre-req:** Run `npx playwright install chrome`.

---

### 3. Fetch MCP

* **Purpose:** Retrieve web content for LLM processing.
* **Tools:** `fetch`
* **When to use:** Docs, API responses, web resources.

---

### 4. ShadCN MCP

* **Purpose:** UI component management.
* **Key Tools:**

  * `get_project_registries`
  * `search_items_in_registries`
  * `view_items_in_registries`
  * `get_item_examples_from_registries`
  * `get_add_command_for_items`
* **When to use:** Building UIs, finding components, installing shadcn/ui.

---

### 5. GitMCP

* **Purpose:** GitHub repo access (docs + code).
* **Key Tools:**

  * `fetch_documentation`
  * `search_documentation`
  * `search_code`
  * `fetch_generic_url_content`
* **When to use:** Get README, API docs, examples directly from repos.
* **URL patterns:**

  * `gitmcp.io/{owner}/{repo}`
  * `{owner}.gitmcp.io/{repo}`
  * `gitmcp.io/docs`

---

### 6. Ref MCP

* **Purpose:** Precision documentation search & anti-hallucination.
* **Key Tools:**

  * `ref_search_documentation`
  * `ref_read_url`
* **Features:** Token-efficient (5k limit), session-aware, private docs support.
* **When to use:** Exact API lookup, PDF/private repo docs, avoiding hallucinations.

---

## Development Rules

* **Rule 1:** Always use Sequential-Thinking for complex analysis, trade-offs, debugging.
* **Rule 2:** Use Playwright for automation, scraping, screenshots, UI validation.
* **Rule 3:** Use Fetch for docs retrieval, API responses, error messages.
* **Rule 4:** Use ShadCN for UI components.
* **Rule 5:** Use GitMCP for GitHub repos (docs/code).
* **Rule 6:** Use Ref for precise docs and anti-hallucination.

---

## Web Search Integration

* Always prioritize **official docs** → GitHub issues → Stack Overflow → blogs.
* For errors: search web → fetch docs → analyze with Sequential-Thinking.
* Before using new tools: search web for latest version, deprecations, compat.

---

## Workflow Integration

* **Default workflow:**
  Plan (Sequential) → Research (Ref/Fetch/GitMCP) → Implement (Playwright/ShadCN) → Test (Playwright).
* **Fallback protocol:**
  If MCP fails → web search → Fetch → Sequential analysis → document workaround.

---

## Quality Assurance

* Validate all installations & automation.
* Always cite which MCP was used.
* Provide examples of tool usage.
* Use Playwright for automated UI tests & screenshots.

---

## Emergency Protocols

* Use Sequential-Thinking + Fetch for blocking issues.
* For dependency conflicts: check compat, fetch migration guides, test via Playwright.

---

## GitMCP Specific Rules

* **Anti-hallucination:** Always use GitMCP for unknown libraries/APIs.
* **Repository selection:** Choose URL form based on scope (specific repo vs docs).
* **Doc hierarchy:** `llms.txt` → `llms-full.txt` → `README.md` → docs → code.
* **Code search best practice:** Combine `search_code` + `search_documentation`.

---

## Ref MCP Protocol

* Use Ref as **primary** doc search.
* Workflow: `ref_search_documentation` → refine → `ref_read_url`.
* Documentation hierarchy: Ref > GitMCP > Fetch > Web search.

---

## Continuous Improvement

* Regularly check for MCP updates.
* Share optimized workflows.
* Monitor performance & token usage.

---

## Quick Reference

### Essential Web Searches

```bash
search_web "[tech] official documentation 2025"
search_web "[error_message] fix solution"
search_web "[tech] best practices current"
```

### MCP Combinations

**Precision Research → Plan → Implement**

1. ref\_search\_documentation + gitmcp
2. sequentialthinking
3. shadcn + playwright

**Debug → Analyze → Fix**

1. ref\_search\_documentation + search\_web
2. sequentialthinking
3. playwright

**Anti-Hallucination**

1. ref\_search\_documentation
2. ref\_read\_url
3. gitmcp\_search\_code
4. sequentialthinking
5. implement confidently

---

🔑 **Remember:** Gemini must always use the right MCP server/tool first instead of guessing. Official docs > precise search > reasoning > implementation.


**Remember**: These MCPs are powerful tools - use them strategically, always search for the latest information, and combine them effectively for optimal development outcomes.