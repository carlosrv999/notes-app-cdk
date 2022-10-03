import { CfnOutput, Token } from "aws-cdk-lib";
import { IVpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Cluster, ContainerImage, Secret } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { Database } from "./rds";

export interface ContainerProps {
  vpc: IVpc
  rds: Database
}

export class Container extends Construct {
  service: ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: ContainerProps) {
    super(scope, id);

    const cluster = new Cluster(this, "MyCluster", {
      vpc: props.vpc
    });

    const loadBalancer = new ApplicationLoadBalancer(this, "elb", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
        onePerAz: true
      },
      internetFacing: true,
    })

    const username = Secret.fromSecretsManager(props.rds.databaseCredentials, "username");
    const host = Secret.fromSecretsManager(props.rds.databaseCredentials, "host");
    const password = Secret.fromSecretsManager(props.rds.databaseCredentials, "password");
    const port = Secret.fromSecretsManager(props.rds.databaseCredentials, "port");
    const dbname = Secret.fromSecretsManager(props.rds.databaseCredentials, "dbname");

    this.service = new ApplicationLoadBalancedFargateService(this, "FargateService", {
      cluster,
      taskImageOptions: {
        image: ContainerImage.fromAsset('notesapp'),
        containerPort: 3000,
        secrets: {
          ["username"]: username,
          ["host"]: host,
          ["password"]: password,
          ["port"]: port,
          ["dbname"]: dbname,
        }
      },
      taskSubnets: {
        subnetType: SubnetType.PUBLIC,
        onePerAz: true
      },
      loadBalancer,
      assignPublicIp: true
    })

    new CfnOutput(this, "ElbDnsName", {
      value: this.service.loadBalancer.loadBalancerDnsName
    })

    new CfnOutput(this, "clusterArn", {
      value: cluster.clusterArn
    })
  }
}