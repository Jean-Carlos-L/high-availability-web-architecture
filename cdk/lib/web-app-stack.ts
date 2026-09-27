import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Red (VPC en 2 Zonas de Disponibilidad)
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // 2. Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security Group para el ALB - Permite trafico HTTP/HTTPS exterior',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Permitir trafico HTTP publico al ALB'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security Group para instancias EC2 - Solo accesible mediante ALB',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Permitir trafico HTTP unicamente desde el ALB'
    );

    // 3. Rol IAM con Menor Privilegio
    const ec2Role = new iam.Role(this, 'Ec2AppRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Rol de menor privilegio para EC2 con soporte AWS Systems Manager (SSM)',
    });

    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // 4. Cargar archivo user-data.sh externo
    const userDataPath = path.join(__dirname, '../../application/user-data.sh');
    let userDataScript = '';

    if (fs.existsSync(userDataPath)) {
      userDataScript = fs.readFileSync(userDataPath, 'utf8');
    } else {
      // Fallback por seguridad en caso de que el archivo no se encuentre en el path
      userDataScript = `#!/bin/bash
                        yum update -y
                        yum install -y nginx
                        systemctl start nginx
                        systemctl enable nginx
                        echo "<h1>Default Nginx Server</h1>" > /usr/share/nginx/html/index.html`;
    }

    const userData = ec2.UserData.forLinux();
    userData.addCommands(userDataScript);

    // 5. Auto Scaling Group con capacidad para pico de trafico
    const asg = new autoscaling.AutoScalingGroup(this, 'AppAutoScalingGroup', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      // Health Check a nivel de ELB en vez de solo EC2 para reemplazar instancias no saludables rápidamente
      healthCheck: autoscaling.HealthCheck.elb({ grace: cdk.Duration.seconds(60) }),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(20, {
            volumeType: autoscaling.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    // RETO 2: Politica de escalado basada en CPU (> 60%)
    asg.scaleOnCpuUtilization('CpuScaling60PercentPolicy', {
      targetUtilizationPercent: 60,
      cooldown: cdk.Duration.seconds(60),
    });

    // 6. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // Configuración del Target Group ajustada para cero downtime
    const targetGroup = listener.addTargets('AppFleetTargetGroup', {
      port: 80,
      targets: [asg],
      // Reducción del tiempo de desdrenado (Deregistration Delay)
      deregistrationDelay: cdk.Duration.seconds(15),
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(10),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        healthyHttpCodes: '200',
      },
    });

    // 7. Opcional: Alarma de CloudWatch para monitoreo del evento de escalado
    const cpuUtilizationMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const cpuHighAlarm = new cloudwatch.Alarm(this, 'AsgCpuHighAlarm', {
      metric: cpuUtilizationMetric,
      threshold: 60,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      alarmDescription: 'Alarma disparada cuando el uso de CPU supera el 60% durante la ráfaga 10x.',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Output con la URL del ALB
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'URL publica del ALB para pruebas de la aplicacion',
    });
  }
}