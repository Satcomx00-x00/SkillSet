# security

Offensive security for **authorized testing only**: bug bounty hunting, web vulnerability classes, recon/OSINT, enterprise red-team attack chains, and reporting.

> Use these skills only against targets you are authorized to test — in-scope bug bounty programs or engagements with written permission.

```bash
npx topic-skillset add security            # skills + MCP
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/security   # skills only
```

Claude Code: `/plugin marketplace add Satcomx00-x00/SkillSet` then `/plugin install security@skillset`.

## Skills

83 skills, all named `skillset-bughunter-<skill>`:

- **Vuln-class hunting** (`hunt-*`): sqli, nosqli, xss, ssrf, ssti, xxe, rce, idor, csrf, cors, oauth, jwt-crypto, deserialization, lfi, file-upload, open-redirect, host-header, http-smuggling, cache-poison, race-condition, business-logic, graphql, grpc, websocket, llm-ai, rag-vector, and more.
- **Framework-specific**: aspnet, springboot, laravel, nextjs, nodejs, k8s.
- **Enterprise attack chains**: m365-entra-attack, okta-attack, sharepoint, vmware-vcenter-attack, enterprise-vpn-attack, apk/ios-redteam-pipeline.
- **Recon & OSINT**: offensive-osint, web2-recon, web3-audit, hunt-subdomain, hunt-shadow-api, supply-chain-attack-recon, osint-methodology.
- **Workflow, triage & reporting**: bb-methodology, recon-scope-triage, triage-validation, evidence-hygiene, report-writing, bugcrowd-reporting, redteam-report-template, security-arsenal.

Browse the full list with `skillset info security`.

## Source & license

Vendored from [elementalsouls/Claude-BugHunter](https://github.com/elementalsouls/Claude-BugHunter) by **Sachin Sharma**, pinned by commit in `skills.lock.json` and re-synced weekly.

The upstream is dual-licensed: skill content (`*.md`, wordlists, regex catalogs, rubrics) under **CC BY 4.0**, and scripts (`*.py`) under **MIT**. `skillset-bughunter-offensive-osint` ships three Python recon helpers (`dashboard.py`, `secret_scan.py`, `h1_reference.py`) that run only when you invoke them; `dashboard.py` and `h1_reference.py` make outbound requests to HackerOne's public API.

Not vendored here: the upstream `cbh` CLI (`pip install claude-bughunter`), its HackerOne MCP server (needs your own API token), and its slash commands.
