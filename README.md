# k8s-infra

Kubernetes infrastructure: production-ready manifests, Helm/Kustomize, and cluster troubleshooting.

| Skill | Source |
| --- | --- |
| `skillset-k8s-manifests` | custom |
| `skillset-k8s-troubleshooting` | custom |

| MCP server | Needs |
| --- | --- |
| `kubernetes` ([kubernetes-mcp-server](https://github.com/containers/kubernetes-mcp-server)) | A kubeconfig; starts in `--read-only` mode. Remove that flag to allow changes |

## Install

```bash
npx skill-set add k8s-infra
npx skills add https://github.com/Satcomx00-x00/SkillSet/tree/k8s-infra
/plugin install k8s-infra@skillset     # after: /plugin marketplace add Satcomx00-x00/SkillSet
```

Add third-party skills to `skillset.json` and run `skillset sync`. Tooling lives on [`main`](https://github.com/Satcomx00-x00/SkillSet).
