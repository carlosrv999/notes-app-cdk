import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from '../src/rds';
import { VpcNetwork } from '../src/vpc';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class NotesAppCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new VpcNetwork(this, "Network", {
      cidrBlock: "10.0.0.0/16",
      vpcName: "my-VPC"
    });

    const database = new Database(this, "Database", {
      vpc: vpc.vpc,
    });

  }
}
