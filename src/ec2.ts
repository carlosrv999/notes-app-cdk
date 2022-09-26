import { IInstance, Instance, InstanceClass, InstanceSize, InstanceType, IVpc, MachineImage, OperatingSystemType, Peer, Port, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface UbuntuEc2Props {
  vpc: IVpc,
}

export class UbuntuEc2 extends Construct {
  vm: IInstance;

  constructor(scope: Construct, id: string, props: UbuntuEc2Props) {
    super(scope, id);

    const machineImage = MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id', { os: OperatingSystemType.LINUX }
    )

    const securityGroup = new SecurityGroup(this, "ec2TestSecGroup", {
      vpc: props.vpc,
      allowAllOutbound: true,
    })

    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "Allow SSH Connections from anywhere")

    this.vm = new Instance(this, 'ec2test', {
      instanceType: InstanceType.of(InstanceClass.M6I, InstanceSize.LARGE),
      machineImage: machineImage,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      securityGroup,
      keyName: 'carlosrv'
    })

  }
}