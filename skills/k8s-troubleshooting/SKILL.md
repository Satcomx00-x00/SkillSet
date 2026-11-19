---
name: k8s-troubleshooting
description: Diagnose Kubernetes workloads read-only - CrashLoopBackOff, ImagePullBackOff, Pending pods, OOMKilled, failing probes, Service/Ingress routing and DNS issues. Use when a pod, deployment or service is unhealthy, or the user asks why something in the cluster is broken.
---

# Kubernetes troubleshooting (read-only first)

Never change cluster state while diagnosing. Confirm the context and namespace first: `kubectl config current-context`.

## Triage order
1. `kubectl get pods -n <ns> -o wide` → status, restarts, node.
2. `kubectl describe pod <pod>` → **Events** at the bottom usually name the cause.
3. `kubectl logs <pod> [-c <container>] --previous` for crashed containers.
4. `kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -30`.

## Symptom → likely cause
| Symptom | Check |
| --- | --- |
| `Pending` | Insufficient CPU/memory (`describe` → FailedScheduling), PVC unbound, taints/affinity, quota |
| `ImagePullBackOff` | Image name/tag/digest, registry auth (`imagePullSecrets`), architecture |
| `CrashLoopBackOff` | `logs --previous`; missing env/secret, bad config, failing migrations |
| `OOMKilled` (exit 137) | Memory limit vs real usage (`kubectl top pod`); leaks |
| Running but not Ready | Readiness probe path/port/timeout; dependency down |
| Service unreachable | `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`; selector/label mismatch, targetPort name |
| Ingress 404/502 | Ingress class, host/path rules, backend service port, TLS secret |
| DNS failures | `kubectl run -it --rm dns --image=busybox:1.36 -- nslookup <svc>.<ns>`; CoreDNS pods |

## Report
State the root cause with the evidence (event, log line, field), then propose the fix as a manifest diff for the user to apply through their normal GitOps/CI path.
