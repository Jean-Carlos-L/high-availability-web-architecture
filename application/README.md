# Aplicación web de ejemplo

Contenido de ejemplo para arrancar rápido. **Puedes usarlo tal cual o reemplazarlo por tu propia app.**

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `user-data.sh` | Script de arranque de la instancia EC2. Instala **nginx** y publica una página que muestra el ID y la **Availability Zone** de la instancia (ideal para comprobar que el ALB balancea entre varias). También crea `/health` para el health check del target group. |
| `index.html` | Página estática de ejemplo (versión "de escritorio" del contenido). En el reto real, la página la genera `user-data.sh` dentro de la instancia. |

## Cómo conectar `user-data.sh` con tu stack CDK

La idea es que tu Auto Scaling Group / Launch Template use este script como **user data**.

**Ejemplo conceptual (TypeScript):**

```ts
import * as fs from 'fs';
import * as path from 'path';

const userData = ec2.UserData.custom(
  fs.readFileSync(path.join(__dirname, '..', '..', 'application', 'user-data.sh'), 'utf8')
);
// luego pásalo al AutoScalingGroup / LaunchTemplate
```

> El resto (VPC, ALB, ASG, Security Groups, EBS, IAM) lo diseñas tú. Este archivo solo
> resuelve "qué corre dentro de la instancia" para que puedas concentrarte en la arquitectura.

## Probar la página localmente

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## Health check sugerido

El `user-data.sh` publica `/health` devolviendo `ok`. Configura el health check de tu
target group hacia esa ruta (código esperado: 200).
