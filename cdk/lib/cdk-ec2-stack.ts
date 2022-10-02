import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';


import { readFileSync } from 'fs';

export class CdkEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ImportVPC', { isDefault: true });

    // Security Group
    const proyectitoSG = new ec2.SecurityGroup(this, 'proyectito-ses-ec2-sg', {
      vpc,
      allowAllOutbound: true,
    });

    proyectitoSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere'
    );

    proyectitoSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      'allow HTTP traffic from anywhere'
    );

    const copstoneSesIdentityParam =
      ssm.StringParameter.fromStringParameterName(
        this,
        'CopstoneSESIdentity',
        '/Copstone/SES/Identity'
      );

    // IAM Role
    const sesRole = new iam.Role(this, 'proyectito-ses-ec2-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        sesPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ses:SendEmail'],
              resources: [copstoneSesIdentityParam.stringValue],
            }),
          ],
        }),
      },
    });

    const cfnKeyPair = new ec2.CfnKeyPair(this, 'MyCfnKeyPair', {
      keyName: 'ec2-key-pair',
    });

    const userDataScript = readFileSync('./cdk/scripts/user-data.sh', 'utf-8');

    // EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: sesRole,
      securityGroup: proyectitoSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: cfnKeyPair.keyName,
      userData: ec2.UserData.custom(userDataScript),
    });

    // Output
    new cdk.CfnOutput(this, 'ec2-instance-public-ip', {
      value: ec2Instance.instancePublicIp,
    });
  }
}

