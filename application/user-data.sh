#!/bin/bash
# ─────────────────────────────────────────────────────────────
# user-data de EJEMPLO — Reto 2: Aplicación Web de Alta Demanda
#
# Este script se ejecuta al arrancar cada instancia EC2 (Amazon Linux 2023
# o Amazon Linux 2). Instala nginx y publica una página de prueba que
# muestra el hostname/AZ de la instancia, útil para comprobar que el ALB
# está balanceando entre varias instancias.
#
# Cómo lo usa tu stack CDK:
#   - En TypeScript, puedes leer este archivo y pasarlo como user-data:
#       const userData = ec2.UserData.custom(
#         fs.readFileSync('../application/user-data.sh', 'utf8')
#       );
#   - O añadir los comandos con userData.addCommands(...).
#
# Puedes reemplazarlo por el arranque de tu propia aplicación.
# ─────────────────────────────────────────────────────────────
set -euxo pipefail

# Instala nginx (compatible con Amazon Linux 2 y 2023)
if command -v dnf >/dev/null 2>&1; then
  dnf install -y nginx
else
  amazon-linux-extras install -y nginx1 || yum install -y nginx
fi

# Metadatos de la instancia (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300" || true)
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/instance-id || echo "desconocido")
AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/availability-zone || echo "desconocida")

# Página de prueba: muestra qué instancia respondió (para ver el balanceo)
cat > /usr/share/nginx/html/index.html <<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>App de Alta Demanda</title></head>
<body style="font-family:system-ui;text-align:center;padding:3rem;background:#0f172a;color:#e2e8f0">
  <h1 style="color:#ff9900">✅ Aplicación Web de Alta Demanda</h1>
  <p>Servida por Amazon EC2 detrás de un Application Load Balancer.</p>
  <p><strong>Instancia:</strong> ${INSTANCE_ID}</p>
  <p><strong>Availability Zone:</strong> ${AZ}</p>
  <p style="color:#94a3b8">Recarga varias veces: el ALB debería alternar entre instancias/AZs.</p>
</body>
</html>
HTML

# Endpoint simple para health checks del target group (200 OK)
echo "ok" > /usr/share/nginx/html/health

systemctl enable nginx
systemctl start nginx
