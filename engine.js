/**
 * CostWhisperer Core Knowledge & Leak Diagnostic Engine
 * Curated knowledge base of sneaky AWS billing line items, plain-English explanations, and remediation CLI commands.
 */

const JARGON_DATABASE = {
  "natgateway": {
    sku: "AmazonEC2 - NatGateway-Bytes & NatGateway-Hours",
    title: "NAT Gateway Toll Tax",
    summary: "AWS charges $0.045/hr + $0.045/GB just to route outbound internet traffic from private subnets (e.g. EC2/ECS downloading Docker images or pulling from S3).",
    whyItHurts: "If your private containers pull Docker images from DockerHub or upload backups to S3 through a NAT Gateway, you pay AWS double: data processing + egress.",
    fixTitle: "Deploy S3/ECR Gateway Endpoints (100% Free)",
    estimatedSavingsMonthly: "$120 - $850 / month",
    cliFix: `# 1. Create a free VPC Gateway Endpoint for Amazon S3
aws ec2 create-vpc-endpoint \\
  --vpc-id vpc-0123456789abcdef0 \\
  --service-name com.amazonaws.us-east-1.s3 \\
  --route-table-ids rtb-0123456789abcdef0

# 2. Check current active NAT Gateways
aws ec2 describe-nat-gateways --filter "Name=state,Values=available"`
  },

  "orphaned_ebs": {
    sku: "AmazonEC2 - VolumeUsage.gp2 / gp3 (Unattached)",
    title: "Ghost Storage (Orphaned EBS Volumes)",
    summary: "When you terminate an EC2 instance without 'DeleteOnTermination' enabled, or when you stop an instance, the EBS SSD disks remain alive and continue billing full price 24/7.",
    whyItHurts: "A 500GB gp2 volume left behind costs ~$50/mo. Ten forgotten dev volumes will quietly drain $500/mo forever.",
    fixTitle: "Delete or Snapshot Unattached Volumes & Migrate gp2 -> gp3",
    estimatedSavingsMonthly: "$40 - $600 / month",
    cliFix: `# Find all unattached (available) EBS volumes
aws ec2 describe-volumes \\
  --filters Name=status,Values=available \\
  --query "Volumes[*].{ID:VolumeId,Size:Size,Type:VolumeType,Created:CreateTime}" \\
  --output table

# Delete an unattached volume after taking a snapshot (optional)
aws ec2 delete-volume --volume-id vol-0123456789abcdef0`
  },

  "unused_eip": {
    sku: "AmazonEC2 - ElasticIP:Idle",
    title: "Abandoned Public IPv4 / Elastic IPs",
    summary: "AWS now charges $0.005/hour (~$3.65/month) for every public IPv4 address, and previously charged for idle unallocated Elastic IPs.",
    whyItHurts: "Developers allocate Elastic IPs for testing, terminate the server, and leave 5-10 EIPs floating in the VPC.",
    fixTitle: "Release Unassociated Elastic IPs",
    estimatedSavingsMonthly: "$15 - $75 / month",
    cliFix: `# List Elastic IPs that are NOT associated with any instance
aws ec2 describe-addresses \\
  --query "Addresses[?AssociationId==null].{AllocationId:AllocationId,PublicIp:PublicIp}" \\
  --output table

# Release the idle Elastic IP back to AWS
aws ec2 release-address --allocation-id eipalloc-0123456789abcdef0`
  },

  "cross_az_data": {
    sku: "AmazonEC2 - DataTransfer-Regional-Bytes",
    title: "The Multi-AZ Chatty Tax",
    summary: "Traffic between two EC2 instances in different Availability Zones (even in the same region and VPC) costs $0.01/GB in each direction ($0.02/GB total).",
    whyItHurts: "If your microservices or Kafka/Database replicas stream terabytes across AZs without co-location or caching, your data transfer bill skyrockets.",
    fixTitle: "Enforce AZ Affinity or VPC Peering Optimization",
    estimatedSavingsMonthly: "$200 - $1,800 / month",
    cliFix: `# Check top talkers across regional AZs using VPC Flow Logs
aws ec2 describe-flow-logs --query "FlowLogs[*].{Id:FlowLogId,Status:FlowLogStatus}"

# Ensure your ECS / EKS tasks use AZ-aware routing / topology spread`
  },

  "cloudwatch_retention": {
    sku: "AmazonCloudWatch - PutLogEvents & Log Storage",
    title: "Immortal CloudWatch Logs",
    summary: "By default, AWS CloudWatch log groups have their retention set to 'Never Expire'. Your Lambda debug logs from 2021 are still generating bills.",
    whyItHurts: "High-volume debug logging accumulating gigabytes of data stored indefinitely at $0.03/GB/month.",
    fixTitle: "Set Log Retention to 14 or 30 Days",
    estimatedSavingsMonthly: "$35 - $300 / month",
    cliFix: `# List log groups with 'Never Expire' retention
aws logs describe-log-groups \\
  --query "logGroups[?!retentionInDays].logGroupName" \\
  --output table

# Set 14-day retention policy on a high-volume log group
aws logs put-retention-policy \\
  --log-group-name "/aws/lambda/my-busy-function" \\
  --retention-in-days 14`
  },

  "idle_rds": {
    sku: "AmazonRDS - Multi-AZ Provisioned / Idle Test DBs",
    title: "The Weekend Staging Relational DB",
    summary: "Staging and dev PostgreSQL/MySQL databases running Multi-AZ with Provisioned IOPS (io1/io2) over weekends when no engineers are online.",
    whyItHurts: "A db.r6g.xlarge Multi-AZ with 1,000 IOPS runs ~$550+/month even when idle.",
    fixTitle: "Auto-Stop Staging DBs on Nights/Weekends or Switch to Aurora Serverless v2",
    estimatedSavingsMonthly: "$250 - $1,100 / month",
    cliFix: `# Temporarily stop a staging RDS instance for the weekend
aws rds stop-db-instance --db-instance-identifier staging-postgres-db

# Or migrate to Aurora Serverless v2 with min ACU = 0.5`
  }
};

const SAMPLE_SCENARIOS = {
  startup_surprise: {
    name: "🚀 The Startup Surprise ($1,420/mo NAT leak)",
    description: "A seed-stage startup deploying Docker containers in private ECS subnets with unexpected 4-figure bills.",
    billText: `AWS Invoice Summary - US East (N. Virginia):
- Amazon Elastic Compute Cloud - NatGateway-Bytes: $842.10 (Data processed: 18,713 GB)
- Amazon Elastic Compute Cloud - NatGateway-Hours: $64.80 (2 Gateways running 720 hrs)
- Amazon Elastic Compute Cloud - DataTransfer-Regional-Bytes: $214.30
- Amazon Elastic Block Store - VolumeUsage.gp2: $148.00 (1,480 GB-Mo)
- AmazonCloudWatch - PutLogEvents & StoredBytes: $152.40 (Never Expire logs)
Total: $1,421.60`,
    anxiety: 90
  },
  dormant_playground: {
    name: "🧪 The Dormant Dev Playground ($485/mo idle resources)",
    description: "Abandoned hackathon projects, unattached SSD volumes, and unallocated Elastic IPs.",
    billText: `AWS Cost & Usage Report - Development Account:
- Amazon Elastic Block Store - VolumeUsage.gp2 (unattached): $210.00 (2,100 GB idle)
- Amazon Elastic Compute Cloud - ElasticIP:Idle: $36.00 (10 unassociated addresses)
- Amazon RDS - InstanceUsage:db.t3.medium (Dev Postgres running 24/7): $122.40
- Amazon Simple Storage Service - TimedStorage-ByteHrs (non-current versions): $116.60
Total: $485.00`,
    anxiety: 60
  },
  chatty_microservice: {
    name: "⚡ The Cross-AZ Chatty Microservice ($1,850/mo)",
    description: "Kubernetes/ECS microservices deployed across 3 Availability Zones firing millions of inter-service RPCs.",
    billText: `AWS Billing Breakdown - Production VPC:
- Amazon Elastic Compute Cloud - DataTransfer-Regional-Bytes: $1,240.00 (62,000 GB across AZs)
- Amazon Elastic Compute Cloud - NatGateway-Bytes: $380.00 (S3 bucket downloads through NAT)
- AmazonCloudWatch - PutLogEvents (DEBUG level enabled in prod): $230.00
Total: $1,850.00`,
    anxiety: 80
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JARGON_DATABASE, SAMPLE_SCENARIOS };
}
