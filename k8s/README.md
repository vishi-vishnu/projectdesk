# Run ProjectDesk on Kubernetes

These files run the same Docker image that CI publishes to
`ghcr.io/vishi-vishnu/projectdesk`, with 2 pods behind a Service, health
probes and zero-downtime updates. CI deploys them to a throwaway
[kind](https://kind.sigs.k8s.io/) cluster on every push to prove they work.

| File | What it is |
| --- | --- |
| `namespace.yaml` | A separate space called `projectdesk`, so nothing mixes with other apps. |
| `configmap.yaml` | Settings for the container. `API_ORIGIN` is where `/api/` calls are forwarded (the Vercel functions). |
| `deployment.yaml` | 2 copies (pods) of the web container, CPU and memory limits, readiness and liveness probes on `/healthz`, rolling updates. |
| `service.yaml` | One stable address inside the cluster that spreads traffic over the pods. |
| `kustomization.yaml` | Lets `kubectl apply -k k8s/` apply everything above at once. |
| `hpa.yaml` | Optional autoscaler: 2 to 5 pods based on CPU. Needs metrics-server. |

## Try it on your computer (Windows)

1. Install **Docker Desktop**, open **Settings > Kubernetes**, tick **Enable Kubernetes** and click **Apply & restart**. This gives you a one-node cluster and the `kubectl` command.
2. In the project folder:

   ```bash
   kubectl apply -k k8s/
   kubectl -n projectdesk get pods            # wait until both say Running and 1/1
   kubectl -n projectdesk port-forward service/projectdesk 8080:80
   ```

3. Open http://localhost:8080 and sign in with a demo account. Login works because `localhost` is an allowed domain in Firebase, and uploads work because nginx forwards `/api/` to the Vercel functions.

## Things to try (and talk about)

```bash
# See the probes and events
kubectl -n projectdesk describe deployment projectdesk

# Self-healing: delete a pod and watch Kubernetes replace it
kubectl -n projectdesk delete pod -l app.kubernetes.io/name=projectdesk --wait=false
kubectl -n projectdesk get pods -w

# Scale out and back
kubectl -n projectdesk scale deployment projectdesk --replicas=4

# Roll out a specific build (every CI build is tagged with its commit)
kubectl -n projectdesk set image deployment/projectdesk web=ghcr.io/vishi-vishnu/projectdesk:<commit>
kubectl -n projectdesk rollout status deployment/projectdesk

# Roll back to the previous version
kubectl -n projectdesk rollout undo deployment/projectdesk

# Logs from all pods
kubectl -n projectdesk logs -l app.kubernetes.io/name=projectdesk --tail=20

# Remove everything
kubectl delete -k k8s/
```

With minikube instead of Docker Desktop: `minikube start`, then the same commands. For the autoscaler, run `minikube addons enable metrics-server` and `kubectl apply -f k8s/hpa.yaml`.
