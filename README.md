# Reto 2 — Aplicación Web de Alta Demanda

> **Nivel:** Intermedio · **Programa:** AWS Cloud Practitioner Challenge · **AWS SBG Univalle**

Despliega una aplicación web en **Amazon EC2** tolerante a fallos, con **balanceo de carga** y **alta disponibilidad** en múltiples Availability Zones, todo definido con **AWS CDK**.

---

## 🎯 Objetivo

Desplegar una aplicación web en EC2 que sea **tolerante a fallos**, use **balanceo de carga** y esté distribuida en **múltiples Availability Zones**, aprovisionando toda la infraestructura con **AWS CDK**.

La historia completa del problema y los requisitos funcionales están en **[`requirements.md`](./requirements.md)**.

---

## 🧰 Prerrequisitos

Antes de empezar, asegúrate de tener:

- [ ] **Node.js** 18+ (necesario para el CLI de CDK, sin importar el lenguaje que elijas)
- [ ] **AWS CLI** configurado con credenciales válidas (`aws configure`)
- [ ] **AWS CDK CLI** instalado globalmente:
  ```bash
  npm install -g aws-cdk
  cdk --version
  ```
- [ ] Runtime del lenguaje que vayas a usar (uno de):
  - **TypeScript / JavaScript** → Node.js 18+
  - **Python** → Python 3.9+ y `pip`
  - **Java** → JDK 11+ y Maven
  - **Go** → Go 1.18+
  - **C#** → .NET 6+
- [ ] Un **EC2 Key Pair** en tu región **solo si** quieres acceso SSH para depurar (opcional; no es necesario para el reto).

---

## 🚀 Inicio Rápido

Este Starter Kit **no incluye el proyecto CDK ya inicializado**: tú eliges el lenguaje.

### 1. Inicializa tu proyecto CDK en la carpeta `cdk/`

```bash
cd cdk
```

Elige **uno** de los siguientes lenguajes y ejecútalo dentro de `cdk/`:

```bash
# TypeScript
cdk init app --language typescript

# Python
cdk init app --language python

# Java
cdk init app --language java

# Go
cdk init app --language go

# C#
cdk init app --language csharp
```

> 💡 `cdk init` requiere que la carpeta esté vacía. La carpeta `cdk/` viene vacía a propósito para que puedas inicializar en tu lenguaje preferido.

### 2. Bootstrap del entorno (solo una vez por cuenta/región)

```bash
cdk bootstrap
```

### 3. Sintetiza, despliega y destruye

```bash
cdk synth      # Genera la plantilla de CloudFormation (valida tu código)
cdk deploy     # Despliega la infraestructura en AWS
cdk destroy    # Elimina TODOS los recursos (¡obligatorio al terminar!)
```

---

## 📁 Estructura del repositorio

```
challenge-02-highdemand-student/
├── README.md              # Este archivo (inicio rápido)
├── requirements.md        # Historia del problema y requisitos funcionales
├── cdk/                   # 👉 Inicializa aquí tu proyecto CDK (viene vacía)
├── application/           # App web de EJEMPLO (user-data + página de prueba)
│   ├── user-data.sh
│   ├── index.html
│   └── README.md
└── docs/
    └── architecture.md    # Plantilla para que documentes tu arquitectura
```

---

## 🗂️ ¿Qué hay en cada carpeta?

| Carpeta / Archivo | Para qué sirve |
|---|---|
| `cdk/` | Aquí construyes tu infraestructura como código. Empieza vacía. |
| `application/` | Un **script de arranque (`user-data.sh`)** que instala nginx y publica una página de prueba, más el `index.html` de ejemplo. **Puedes usarlo tal cual o construir tu propia app.** |
| `docs/architecture.md` | Plantilla para que documentes tu diseño de arquitectura. |
| `requirements.md` | Lo que tu solución debe cumplir. |

---

## ✅ Lo que debes construir (resumen)

1. **VPC** con subnets públicas en al menos **2 Availability Zones**.
2. **Instancias EC2** con un servidor web básico (nginx o Apache).
3. **Application Load Balancer (ALB)** distribuyendo el tráfico entre las instancias.
4. **Auto Scaling Group** con **mínimo 2** y **máximo 6** instancias.
5. **Security Groups**: solo el ALB acepta tráfico en 80/443; las EC2 solo aceptan tráfico del ALB.
6. **Volúmenes EBS** para persistencia de datos de la app.
7. **Roles IAM** con mínimo privilegio para las instancias EC2.

Consulta **[`requirements.md`](./requirements.md)** para el detalle y los criterios de éxito.

---

## 🧹 Cleanup (¡importante!)

Al terminar el reto, elimina todos los recursos para evitar costos:

```bash
cd cdk
cdk destroy
```

> ⚠️ Los **volúmenes EBS** no se eliminan automáticamente si `removalPolicy` no está configurado.
> Revisa la consola de AWS por **recursos huérfanos** (volúmenes EBS, ENIs, Elastic IPs) tras destruir.

---

## 📚 Recursos útiles

- [AWS CDK — Documentación oficial](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [Amazon EC2](https://docs.aws.amazon.com/ec2/) · [VPC](https://docs.aws.amazon.com/vpc/) · [ELB](https://docs.aws.amazon.com/elasticloadbalancing/) · [Auto Scaling](https://docs.aws.amazon.com/autoscaling/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

_AWS Student Builder Group — Universidad del Valle_
