#!/usr/bin/env bash
# Tạo security group: 22 chỉ IP của bạn, 80/443 mọi nơi. Không mở 3000, 27017.
set -euo pipefail
VPC_ID="${1:?cần VPC id}"
MY_IP="$(curl -fsS https://checkip.amazonaws.com)/32"
SG_ID=$(aws ec2 create-security-group --group-name nexus-web --description "Nexus web" --vpc-id "$VPC_ID" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 --cidr "$MY_IP"
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0
echo "$SG_ID"
