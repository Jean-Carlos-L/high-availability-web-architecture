# Requisitos — Aplicación Web de Alta Demanda

## 📖 Contexto (historia del problema)

El grupo **SBG** necesita desplegar una aplicación web para un **evento de alto tráfico**. Se espera que **cientos de usuarios** accedan simultáneamente. La infraestructura debe:

- **Sobrevivir la caída de al menos una Availability Zone.**
- **Balancear la carga** entre varias instancias.
- **Escalar** para absorber picos de demanda.
- No exponer las instancias EC2 directamente a internet.

Tu misión como builder es diseñar y desplegar esta plataforma usando **AWS CDK**, eligiendo el lenguaje de programación que prefieras.

---

## 📋 Requisitos funcionales

| # | Requisito |
|---|---|
| R1 | **VPC** con subnets públicas en al menos **2 Availability Zones**. |
| R2 | **Instancias EC2** con un servidor web básico (nginx o Apache). |
| R3 | **Application Load Balancer (ALB)** distribuyendo el tráfico entre las instancias. |
| R4 | **Auto Scaling Group** configurado con **mínimo 2** y **máximo 6** instancias. |
| R5 | **Security Groups** correctos: solo el **ALB** acepta tráfico en 80/443; las EC2 solo aceptan tráfico del ALB. |
| R6 | **Volúmenes EBS** para persistencia de datos de la aplicación. |
| R7 | **Roles IAM** con mínimo privilegio para las instancias EC2. |

---

## 🧩 Servicios AWS

| Servicio | Rol en el reto |
|---|---|
| **EC2** | Ejecuta la aplicación web |
| **EBS** | Almacenamiento persistente para la app |
| **ELB (ALB)** | Distribuye el tráfico entre instancias |
| **Auto Scaling** | Escala automáticamente según demanda |
| **VPC** | Red virtual aislada con subnets públicas |
| **IAM** | Roles y permisos para las instancias |

**Conceptos clave:** Compute · Escalabilidad horizontal · Alta disponibilidad

---

## 📦 Entregables

- [ ] VPC con subnets en **2 AZs** desplegada con CDK.
- [ ] Auto Scaling Group con **mínimo 2 instancias activas**.
- [ ] ALB distribuyendo tráfico correctamente (**health checks verdes**).
- [ ] **Acceso a la aplicación web desde la URL del ALB.**
- [ ] Security Group que **bloquea acceso directo a EC2** (solo por ALB).
- [ ] `cdk deploy` **sin errores manuales**.

---

## 🏁 Criterios de éxito

1. La **URL del ALB** responde con el contenido de la aplicación.
2. Al **terminar una instancia EC2** manualmente, el ALB redirige **sin tiempo de inactividad perceptible**.
3. El Auto Scaling Group **lanza una nueva instancia** para reemplazar la terminada.
4. Las instancias EC2 **no son accesibles directamente** desde internet (solo por el ALB).

---

## 🐉 Boss Fight (cambio de requisitos en vivo)

> ⚠️ **¡El evento fue un éxito!** El tráfico aumenta **10x** en los próximos 30 minutos.

**¿Qué cambia?**

- Configura una **política de escalado basada en CPU** (si CPU > 60%, agrega instancias).
- El Auto Scaling Group debe **escalar hacia afuera sin intervención manual**.
- *Opcional:* configura **CloudWatch Alarms** en tu stack CDK para monitorear el evento de escala.
- Verifica que el **ALB no se convierta en el cuello de botella**.

---

## 🧹 Cleanup obligatorio

Al terminar:

```bash
cd cdk
cdk destroy
```

> ⚠️ Los volúmenes **EBS** no se eliminan automáticamente si `removalPolicy` no está configurado.
> Revisa la consola de AWS por recursos huérfanos (volúmenes EBS, ENIs, Elastic IPs).
