import { IInstance, InstanceClass, InstanceSize, InstanceType, IVpc, Port, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, IDatabaseInstance, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

export interface IDatabaseInstanceProps {
  readonly vpc: IVpc,
  readonly ec2: IInstance,
}

export class Database extends Construct {
  vpc: IVpc;
  databaseInstance: IDatabaseInstance;

  constructor(scope: Construct, id: string, props: IDatabaseInstanceProps) {
    super(scope, id);

    const instanceIdentifier = 'postgresql-01'
    const credsSecretName = `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase()
    const creds = new DatabaseSecret(this, 'PostgreSQLCredentials', {
      secretName: credsSecretName,
      username: 'carlosrv'
    })

    this.vpc = props.vpc;
    this.databaseInstance = new DatabaseInstance(this, "PostgresInstance", {
      vpc: this.vpc,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14,
      }),
      instanceIdentifier,
      allocatedStorage: 20,
      vpcSubnets: {
        onePerAz: true,
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      credentials: Credentials.fromSecret(creds),
      instanceType: InstanceType.of(InstanceClass.M6I, InstanceSize.LARGE)
    })

    this.databaseInstance.connections.allowFrom(props.ec2, Port.tcp(5432));

  }
}