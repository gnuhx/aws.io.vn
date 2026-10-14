#!/usr/bin/env bash
# Tạo security group cho Nexus: 22 chỉ IP của bạn, 80/443 mở; 3000 và 27017 KHÔNG mở.
#   VPC_ID=vpc-xxxx bash deploy/aws-network.sh
set -euo pipefail
: "${VPC_ID:?Cần VPC_ID}"
MY_IP="$(curl -fsS https://checkip.amazonaws.com)/32"

SG_ID=$(aws ec2 create-security-group --group-name nexus-web --description "Nexus web: SSH from admin, HTTP/HTTPS public" \
  --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22  --cidr "$MY_IP"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80  --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 describe-security-groups --group-ids "$SG_ID" \
  --query 'SecurityGroups[0].IpPermissions[].{port:FromPort,cidr:IpRanges[0].CidrIp}' --output table
echo "SG_ID=$SG_ID"
