---
name: skillset-k8s-manifests
description: Write production-ready Kubernetes manifests, Helm charts and Kustomize overlays - resources, probes, security context, autoscaling, disruption budgets, network policies and GitOps layout. Use when creating or reviewing Deployments, Services, Ingress/Gateway, Helm values, or hardening workloads.
---

# Kubernetes manifests

## Every workload
```yaml
spec:
  replicas: 2                       # ≥2 for anything user-facing
  template:
    spec:
      securityContext: { runAsNonRoot: true, seccompProfile: { type: RuntimeDefault } }
      containers:
        - name: app
          image: ghcr.io/org/app@sha256:…   # pin by digest, never :latest
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { memory: 256Mi }     # memory limit; usually no CPU limit
          readinessProbe: { httpGet: { path: /readyz, port: http } }
          livenessProbe:  { httpGet: { path: /healthz, port: http }, initialDelaySeconds: 10 }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: [ALL] }
```
- Labels: `app.kubernetes.io/{name,instance,version,component,part-of}`.
- Config in ConfigMaps; secrets via External Secrets / Sealed Secrets / SOPS, never plain `Secret` YAML in git.
- Add a `PodDisruptionBudget`, `HorizontalPodAutoscaler`, and `topologySpreadConstraints` across zones for production.
- Default-deny `NetworkPolicy` per namespace, then allow what's needed.
- Expose with Gateway API (`HTTPRoute`) where the cluster supports it, otherwise Ingress with TLS via cert-manager.

## Packaging
- **Kustomize** for app overlays (`base/` + `overlays/{dev,staging,prod}`); **Helm** for distributable charts. Don't template Helm inside Kustomize unless needed.
- Helm: `values.schema.json`, no logic in values, `helm lint` + `helm template | kubeconform` in CI.

## GitOps
Argo CD or Flux reconciles from git; humans don't `kubectl apply` to prod. One app per directory, environments as overlays, image updates via automation PRs.

## Validate before merge
`kubeconform -strict`, `kube-linter` or `kubescape`, and a server-side dry run: `kubectl apply --dry-run=server -k overlays/prod`.
