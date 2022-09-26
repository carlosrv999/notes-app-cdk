import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface IVpcNetworkProps {
  readonly vpcName: string,
  readonly cidrBlock: string,
}

export class VpcNetwork extends Construct {
  vpc: Vpc;

  constructor(scope: Construct, id: string, props: IVpcNetworkProps) {
    super(scope, id);

    this.vpc = new Vpc(this, props.vpcName, {
      cidr: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [{
        name: 'SubnetPrivate-1',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 25,
      },{
        name: 'SubnetPublic-2',
        subnetType: SubnetType.PUBLIC,
        cidrMask: 25
      },{
        name: 'DBSubnet-1',
        subnetType: SubnetType.PUBLIC,
        cidrMask: 25
      }]
    })
  }
}