import * as cdk from 'aws-cdk-lib';
import { Port } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { getConfig } from '../build-config';
import { Container } from '../src/container';
import { Database } from '../src/rds';
import { VpcNetwork } from '../src/vpc';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface NotesAppCdkStackProps extends cdk.StackProps {}

export class NotesAppCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: NotesAppCdkStackProps) {
    super(scope, id, props);

    console.log('from cdk.json 👉', this.node.tryGetContext('bucket'));
    console.log('region 👉', this.node.tryGetContext('region'));

    const vpc = new VpcNetwork(this, "Network", {
      cidrBlock: "10.0.0.0/16",
      vpcName: "my-VPC"
    });

    const database = new Database(this, "Database", {
      vpc: vpc.vpc,
      databaseName: "notesapp",
      dbuser: "notes_user",
      instanceIdentifier: 'postgresql-01',
    });

    const containerCluster = new Container(this, "Container", {
      rds: database,
      vpc: vpc.vpc,
    })

    database.databaseInstance.connections.allowFrom(containerCluster.service.service, Port.tcp(5432), "Allow connections from fargate");

  }
}
