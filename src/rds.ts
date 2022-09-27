import { CfnOutput, Duration, Token } from "aws-cdk-lib";
import { IInstance, InstanceClass, InstanceSize, InstanceType, IVpc, Port, SubnetType } from "aws-cdk-lib/aws-ec2";
import { DockerImageCode } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, IDatabaseInstance, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { CdkResourceInitializer } from './resource-initializer'

export interface IDatabaseInstanceProps {
  readonly vpc: IVpc,
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
      username: 'notes_user'
    })

    this.vpc = props.vpc;
    this.databaseInstance = new DatabaseInstance(this, "PostgresInstance", {
      vpc: this.vpc,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14,
      }),
      instanceIdentifier,
      allocatedStorage: 20,
      databaseName: 'notesapp',
      vpcSubnets: {
        onePerAz: true,
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      },
      credentials: Credentials.fromSecret(creds),
      instanceType: InstanceType.of(InstanceClass.M6I, InstanceSize.LARGE)
    })

    const initializer = new CdkResourceInitializer(this, 'MyRdsInit', {
      config: {
        credsSecretName
      },
      fnLogRetention: RetentionDays.FIVE_MONTHS,
      fnCode: DockerImageCode.fromImageAsset(`${__dirname}/lambda`, {}),
      fnTimeout: Duration.minutes(2),
      fnSecurityGroups: [],
      vpc: props.vpc,
      subnetsSelection: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      })
    })
    // manage resources dependency
    initializer.customResource.node.addDependency(this.databaseInstance)

    // allow the initializer function to connect to the RDS instance
    this.databaseInstance.connections.allowFrom(initializer.function, Port.tcp(5432))

    // allow initializer function to read RDS instance creds secret
    creds.grantRead(initializer.function)

    /* eslint no-new: 0 */
    new CfnOutput(this, 'RdsInitFnResponse', {
      value: Token.asString(initializer.response)
    })

  }
}
